import {
    Injectable,
    NotFoundException,
    InternalServerErrorException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { MailService } from 'src/mail/mail.service';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { FinishShipmentDto } from './dto/finish-shipment.dto';
import { ListShipmentsQueryDto } from './dto/list-shipments-query.dto';
import { ShipmentStatus } from 'src/enums/shipment-status.enum';
import { SERVICE_DELIVERY_DAYS } from 'src/enums/service-type.enum';
import {
    canCancel,
    canFinish,
    formatAddress,
    getAllowedTransitions,
    getRequiredFields,
    getShipmentStatusLabel,
    isAllowedTransition,
    isTerminal,
    normalizeCep,
} from 'src/utils/shipment-status.util';

@Injectable()
export class ShipmentsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly mail: MailService,
    ) { }

    async create(dto: CreateShipmentDto, userId: string) {
        try {
            const trackingCode = this.generateTracking();

            const customer = await this.prisma.customer.findUnique({
                where: { id: dto.customerId },
            });

            if (!customer) {
                throw new NotFoundException('Cliente não encontrado');
            }

            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                select: { id: true, name: true },
            });

            const deliveryDays = SERVICE_DELIVERY_DAYS[dto.serviceType] ?? 7;
            const estimatedDelivery = new Date();
            estimatedDelivery.setDate(estimatedDelivery.getDate() + deliveryDays);

            const shipment = await this.prisma.$transaction(async (tx) => {
                const created = await tx.shipment.create({
                    data: {
                        trackingCode,
                        status: ShipmentStatus.ORDER_CREATED,
                        serviceType: dto.serviceType,
                        weight: dto.weight,
                        estimatedDelivery,

                        senderName: dto.senderName,
                        originStreet: dto.origin.street,
                        originNumber: dto.origin.number,
                        originNeighborhood: dto.origin.neighborhood,
                        originCity: dto.origin.city,
                        originState: dto.origin.state.toUpperCase(),
                        originCep: normalizeCep(dto.origin.cep),

                        recipientName: dto.recipientName,
                        destinationStreet: dto.destination.street,
                        destinationNumber: dto.destination.number,
                        destinationNeighborhood: dto.destination.neighborhood,
                        destinationCity: dto.destination.city,
                        destinationState: dto.destination.state.toUpperCase(),
                        destinationCep: normalizeCep(dto.destination.cep),

                        userId,
                        customerId: dto.customerId,
                    },
                });

                await tx.shipmentItem.createMany({
                    data: dto.items.map((item) => ({
                        shipmentId: created.id,
                        name: item.name,
                        quantity: item.quantity,
                        description: item.description,
                    })),
                });

                await tx.trackingEvent.create({
                    data: {
                        shipmentId: created.id,
                        status: ShipmentStatus.ORDER_CREATED,
                        description: 'Pedido criado',
                        location: formatAddress({
                            street: dto.origin.street,
                            number: dto.origin.number,
                            neighborhood: dto.origin.neighborhood,
                            city: dto.origin.city,
                            state: dto.origin.state,
                            cep: dto.origin.cep,
                        }),
                        changedById: userId,
                        changedByName: user?.name,
                    },
                });

                return created;
            });

            if (customer.email) {
                this.mail
                    .sendShipmentCreated(customer.email, shipment.trackingCode, customer.name)
                    .catch((err) =>
                        console.error('Falha ao enviar email de rastreio:', err),
                    );
            }

            return this.findOne(shipment.id);
        } catch (error) {
            if (
                error instanceof BadRequestException ||
                error instanceof NotFoundException
            ) {
                throw error;
            }
            console.error(error);
            throw new InternalServerErrorException('Falha ao criar encomenda');
        }
    }

    async findAll(query: ListShipmentsQueryDto) {
        return this.prisma.shipment.findMany({
            where: {
                status: query.status,
                customerId: query.customerId,
            },
            include: {
                customer: true,
                items: true,
                trackingEvents: { orderBy: { createdAt: 'asc' } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string) {
        const shipment = await this.prisma.shipment.findUnique({
            where: { id },
            include: {
                customer: true,
                items: true,
                recipient: true,
                trackingEvents: { orderBy: { createdAt: 'asc' } },
                user: { select: { id: true, name: true, email: true } },
            },
        });

        if (!shipment) {
            throw new NotFoundException('Encomenda não encontrada');
        }

        return shipment;
    }

    async updateStatus(
        shipmentId: string,
        status: ShipmentStatus,
        userId: string,
        location?: string,
        description?: string,
    ) {
        // --- Guarda 1: estados reservados para endpoints dedicados ---
        if (status === ShipmentStatus.DELIVERED) {
            throw new BadRequestException(
                'Use o endpoint PATCH /shipments/:id/finish para registrar uma entrega — ' +
                'ele exige assinatura do destinatário e confirmação do CEP.',
            );
        }
        if (status === ShipmentStatus.CANCELLED) {
            throw new BadRequestException(
                'Use o endpoint PATCH /shipments/:id/cancel para cancelar uma encomenda.',
            );
        }

        const shipment = await this.prisma.shipment.findUnique({
            where: { id: shipmentId },
        });

        if (!shipment) throw new NotFoundException('Encomenda não encontrada');

        // --- Guarda 2: estado terminal ---
        if (isTerminal(shipment.status)) {
            throw new BadRequestException(
                `A encomenda já está em estado final "${getShipmentStatusLabel(shipment.status)}" e não aceita novas atualizações.`,
            );
        }

        // --- Guarda 3: transição permitida ---
        if (!isAllowedTransition(shipment.status, status)) {
            const from = getShipmentStatusLabel(shipment.status);
            const to   = getShipmentStatusLabel(status);
            const allowed = getAllowedTransitions(shipment.status).map(getShipmentStatusLabel);
            const hint = allowed.length
                ? `Próximos permitidos via este endpoint: ${allowed.join(', ')}.`
                : `Para encerrar use /cancel ou /finish.`;
            throw new BadRequestException(
                `Transição inválida: "${from}" → "${to}". ${hint}`,
            );
        }

        // --- Guarda 4: campos obrigatórios por status ---
        const requiredFields = getRequiredFields(status);
        const missing: string[] = [];
        if (requiredFields.includes('location') && !location?.trim()) {
            missing.push('"location" (localização atual da encomenda)');
        }
        if (requiredFields.includes('description') && !description?.trim()) {
            missing.push('"description" (descrição obrigatória para este status)');
        }
        if (missing.length) {
            throw new BadRequestException(
                `O status "${getShipmentStatusLabel(status)}" exige os seguintes campos: ${missing.join('; ')}.`,
            );
        }

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { name: true },
        });

        const isRepeatTransit =
            shipment.status === ShipmentStatus.IN_TRANSIT &&
            status === ShipmentStatus.IN_TRANSIT;

        await this.prisma.$transaction(async (tx) => {
            // IN_TRANSIT → IN_TRANSIT: apenas adiciona evento, não altera o status do shipment
            if (!isRepeatTransit) {
                await tx.shipment.update({
                    where: { id: shipmentId },
                    data: { status: Number(status) },
                });
            }

            await tx.trackingEvent.create({
                data: {
                    shipmentId,
                    status: Number(status),
                    description: description?.trim() ?? getShipmentStatusLabel(status),
                    location: location?.trim() ?? null,
                    changedById: userId,
                    changedByName: user?.name,
                },
            });
        });

        return this.findOne(shipmentId);
    }

    async finishShipment(
        shipmentId: string,
        dto: FinishShipmentDto,
        userId: string,
    ) {
        const shipment = await this.prisma.shipment.findUnique({
            where: { id: shipmentId },
            include: { customer: true },
        });

        if (!shipment) throw new NotFoundException('Encomenda não encontrada');

        if (!canFinish(shipment.status)) {
            throw new BadRequestException(
                `Não é possível confirmar a entrega com status "${getShipmentStatusLabel(shipment.status)}". ` +
                `A encomenda deve estar em "Saiu para entrega" para ser finalizada.`,
            );
        }

        const deliveryCep = normalizeCep(dto.deliveryCep);
        const registeredCep = normalizeCep(shipment.destinationCep);

        if (deliveryCep !== registeredCep) {
            throw new BadRequestException(
                `CEP informado (${dto.deliveryCep}) não corresponde ao CEP de destino cadastrado. A entrega não pode ser confirmada neste endereço.`,
            );
        }

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { name: true },
        });

        await this.prisma.$transaction([
            this.prisma.recipient.create({
                data: {
                    shipmentId,
                    signedName: dto.signedName,
                    deliveryCep,
                    phone: dto.phone,
                },
            }),
            this.prisma.shipment.update({
                where: { id: shipmentId },
                data: { status: ShipmentStatus.DELIVERED },
            }),
            this.prisma.trackingEvent.create({
                data: {
                    shipmentId,
                    status: ShipmentStatus.DELIVERED,
                    description: `Entregue e assinado por ${dto.signedName}`,
                    location: dto.location,
                    changedById: userId,
                    changedByName: user?.name,
                },
            }),
        ]);

        if (shipment.customer?.email) {
            this.mail
                .sendShipmentDelivered(shipment.customer.email, shipment.trackingCode, shipment.customer.name)
                .catch((err) =>
                    console.error('Falha ao enviar email de entrega:', err),
                );
        }

        return this.findOne(shipmentId);
    }

    async cancelShipment(shipmentId: string, userId: string, description?: string, location?: string) {
        const shipment = await this.prisma.shipment.findUnique({
            where: { id: shipmentId },
        });

        if (!shipment) throw new NotFoundException('Encomenda não encontrada');

        if (!canCancel(shipment.status)) {
            const currentLabel = getShipmentStatusLabel(shipment.status);
            throw new BadRequestException(
                `Não é possível cancelar uma encomenda com status "${currentLabel}". ` +
                `O cancelamento é permitido apenas nos status: Pedido criado, Em preparação, ` +
                `Extraviado, Danificado, Endereço inválido ou Destinatário ausente.`,
            );
        }

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { name: true },
        });

        await this.prisma.$transaction([
            this.prisma.shipment.update({
                where: { id: shipmentId },
                data: { status: ShipmentStatus.CANCELLED },
            }),
            this.prisma.trackingEvent.create({
                data: {
                    shipmentId,
                    status: ShipmentStatus.CANCELLED,
                    description: description?.trim() || 'Encomenda cancelada',
                    location: location?.trim() ?? null,
                    changedById: userId,
                    changedByName: user?.name,
                },
            }),
        ]);

        return this.findOne(shipmentId);
    }

    async findByTrackingCode(trackingCode: string) {
        const shipment = await this.prisma.shipment.findUnique({
            where: { trackingCode },
            include: {
                recipient: true,
                trackingEvents: { orderBy: { createdAt: 'asc' } },
            },
        });

        if (!shipment) throw new NotFoundException('Encomenda não encontrada');

        return this.toPublicTracking(shipment);
    }

    private toPublicTracking(shipment: {
        trackingCode: string;
        status: number;
        serviceType: string;
        weight: number;
        estimatedDelivery: Date | null;
        senderName: string;
        originStreet: string;
        originNumber: string;
        originNeighborhood: string;
        originCity: string;
        originState: string;
        originCep: string;
        recipientName: string;
        destinationStreet: string;
        destinationNumber: string;
        destinationNeighborhood: string;
        destinationCity: string;
        destinationState: string;
        destinationCep: string;
        createdAt: Date;
        recipient: { signedName: string } | null;
        trackingEvents: {
            status: number;
            description: string | null;
            location: string | null;
            changedByName: string | null;
            createdAt: Date;
        }[];
    }) {
        const deliveredEvent = shipment.trackingEvents.find(
            (e) => e.status === ShipmentStatus.DELIVERED,
        );

        return {
            trackingCode: shipment.trackingCode,
            status: shipment.status,
            statusLabel: getShipmentStatusLabel(shipment.status),
            serviceType: shipment.serviceType,
            weight: shipment.weight,
            estimatedDelivery: shipment.estimatedDelivery,
            senderName: shipment.senderName,
            origin: formatAddress({
                street: shipment.originStreet,
                number: shipment.originNumber,
                neighborhood: shipment.originNeighborhood,
                city: shipment.originCity,
                state: shipment.originState,
                cep: shipment.originCep,
            }),
            recipientName: shipment.recipientName,
            destination: formatAddress({
                street: shipment.destinationStreet,
                number: shipment.destinationNumber,
                neighborhood: shipment.destinationNeighborhood,
                city: shipment.destinationCity,
                state: shipment.destinationState,
                cep: shipment.destinationCep,
            }),
            createdAt: shipment.createdAt,
            deliveredAt: deliveredEvent?.createdAt ?? null,
            signedByName: shipment.recipient?.signedName ?? null,
            timeline: shipment.trackingEvents.map((event) => ({
                status: event.status,
                statusLabel: getShipmentStatusLabel(event.status),
                description: event.description,
                location: event.location,
                changedByName: event.changedByName,
                date: event.createdAt,
            })),
        };
    }

    private generateTracking(): string {
        return (
            'BR' +
            Math.random()
                .toString(36)
                .substring(2, 10)
                .toUpperCase()
        );
    }
}
