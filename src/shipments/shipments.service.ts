import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { ShipmentStatus } from 'src/enums/shipment-status.enum';
import { FinishShipmentDto } from './dto/finish-shipment.dto';
import { ListShipmentsQueryDto } from './dto/list-shipments-query.dto';
import { getShipmentStatusLabel } from 'src/utils/shipment-status.util';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class ShipmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) { }

  async create(dto: CreateShipmentDto, userId: string) {
    try {
      const trackingCode = this.generateTracking();

      if (!dto.items || dto.items.length === 0) {
        throw new BadRequestException(
          'É necessário pelo menos um item para o envio.',
        );
      }

      const customer = await this.prisma.customer.findUnique({
        where: { id: dto.customerId },
      });

      if (!customer) {
        throw new NotFoundException('Cliente não encontrado');
      }

      const shipment = await this.prisma.$transaction(async (tx) => {
        const created = await tx.shipment.create({
          data: {
            trackingCode,
            origin: dto.origin,
            destination: dto.destination,
            status: ShipmentStatus.ORDER_CREATED,
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
          },
        });

        return created;
      });

      if (customer.email) {
        await this.mailService.sendShipmentCreated(
          customer.email,
          trackingCode,
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

      throw new InternalServerErrorException(
        'Falha ao criar encomenda',
      );
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
        trackingEvents: {
          orderBy: { createdAt: 'asc' },
        },
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
        trackingEvents: {
          orderBy: { createdAt: 'asc' },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
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
  ) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id: shipmentId },
    });

    if (!shipment) {
      throw new NotFoundException('Encomenda não encontrada');
    }

    if (
      shipment.status === ShipmentStatus.DELIVERED ||
      shipment.status === ShipmentStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'Encomenda entregue ou cancelada',
      );
    }

    if (status < shipment.status) {
      throw new BadRequestException(
        'Novo status deve ser maior que o atual',
      );
    }

    if (status === shipment.status) {
      return this.findOne(shipmentId);
    }

    await this.prisma.$transaction([
      this.prisma.shipment.update({
        where: { id: shipmentId },
        data: { status: Number(status) },
      }),
      this.prisma.trackingEvent.create({
        data: {
          shipmentId,
          status: Number(status),
          description: getShipmentStatusLabel(status),
        },
      }),
    ]);

    return this.findOne(shipmentId);
  }

  async finishShipment(
    shipmentId: string,
    dto: FinishShipmentDto,
  ) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: { customer: true },
    });

    if (!shipment) {
      throw new NotFoundException('Encomenda não encontrada');
    }

    if (dto.address.trim() !== shipment.destination.trim()) {
      throw new BadRequestException(
        'O endereço informado deve ser igual ao destino da encomenda',
      );
    }

    if (shipment.status === ShipmentStatus.DELIVERED) {
      throw new BadRequestException(
        'Encomenda entregue',
      );
    }

    if (shipment.status === ShipmentStatus.CANCELLED) {
      throw new BadRequestException(
        'Encomenda cancelada',
      );
    }

    await this.prisma.$transaction([
      this.prisma.recipient.create({
        data: {
          shipmentId,
          name: dto.name,
          address: dto.address,
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
          description: getShipmentStatusLabel(ShipmentStatus.DELIVERED),
        },
      }),
    ]);

    if (shipment.customer.email) {
      await this.mailService.sendShipmentDelivered(
        shipment.customer.email,
        shipment.trackingCode,
      );
    }

    return this.findOne(shipmentId);
  }

  async cancelShipment(shipmentId: string) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id: shipmentId },
    });

    if (!shipment) {
      throw new NotFoundException('Encomenda não encontrada');
    }

    if (shipment.status === ShipmentStatus.DELIVERED) {
      throw new BadRequestException(
        'Encomenda já entregue não pode ser cancelada',
      );
    }

    if (shipment.status === ShipmentStatus.CANCELLED) {
      throw new BadRequestException(
        'Encomenda já cancelada',
      );
    }

    await this.prisma.$transaction([
      this.prisma.shipment.update({
        where: { id: shipmentId },
        data: { status: ShipmentStatus.CANCELLED },
      }),
      this.prisma.trackingEvent.create({
        data: {
          shipmentId,
          status: ShipmentStatus.CANCELLED,
          description: getShipmentStatusLabel(ShipmentStatus.CANCELLED),
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
        trackingEvents: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!shipment) {
      throw new NotFoundException('Encomenda não encontrada');
    }

    return this.toPublicTracking(shipment);
  }

  private toPublicTracking(shipment: {
    trackingCode: string;
    status: number;
    origin: string;
    destination: string;
    createdAt: Date;
    recipient: { name: string } | null;
    trackingEvents: {
      status: number;
      description: string | null;
      createdAt: Date;
    }[];
  }) {
    const deliveredEvent = shipment.trackingEvents.find(
      (event) => event.status === ShipmentStatus.DELIVERED,
    );

    return {
      trackingCode: shipment.trackingCode,
      status: shipment.status,
      statusLabel: getShipmentStatusLabel(shipment.status),
      origin: shipment.origin,
      destination: shipment.destination,
      createdAt: shipment.createdAt,
      deliveredAt: deliveredEvent?.createdAt ?? null,
      recipientName: shipment.recipient?.name ?? null,
      timeline: shipment.trackingEvents.map((event) => ({
        status: event.status,
        statusLabel: getShipmentStatusLabel(event.status),
        description: event.description,
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
