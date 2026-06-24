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

@Injectable()
export class ShipmentsService {
  constructor(private readonly prisma: PrismaService) { }

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

      const shipment = await this.prisma.shipment.create({
        data: {
          trackingCode,
          origin: dto.origin,
          destination: dto.destination,
          status: ShipmentStatus.ORDER_CREATED,
          userId,
          customerId: dto.customerId,
        },
      });

      await this.prisma.shipmentItem.createMany({
        data: dto.items.map((item) => ({
          shipmentId: shipment.id,
          name: item.name,
          quantity: item.quantity,
          description: item.description,
        })),
      });

      return shipment;
    } catch (error) {
      console.error(error);

      throw new InternalServerErrorException(
        'Falha ao criar encomenda',
      );
    }
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


    return this.prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        status: Number(status),
      },
    });
  }


  async finishShipment(
    shipmentId: string,
    dto: FinishShipmentDto,
  ) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id: shipmentId },
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


    await this.prisma.recipient.create({
      data: {
        shipmentId,
        name: dto.name,
        address: dto.address,
        phone: dto.phone,
      },
    });


    return this.prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        status: ShipmentStatus.DELIVERED,
      },
      include: {
        items: true,
        recipient: true,
        customer: true,
      },
    });
  }

  async findByTrackingCode(trackingCode: string) {
    const shipment = await this.prisma.shipment.findUnique({
      where: {
        trackingCode,
      },
      include: {
        items: true,
        recipient: true,
        customer: true,
      },
    });

    if (!shipment) {
      throw new NotFoundException('Encomenda não encontrada');
    }

    return shipment;
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