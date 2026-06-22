import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { ShipmentStatus } from 'src/generated/enums';
import { FinishShipmentDto } from './dto/finish-shipment.dto';

@Injectable()
export class ShipmentsService {
  constructor(private readonly prisma: PrismaService) { }

  async create(dto: CreateShipmentDto, userId: string) {
    try {
      const trackingCode = this.generateTracking();

      if (!dto.items || dto.items.length === 0) {
        throw new BadRequestException(
          'At least one item is required for a shipment',
        );
      }

      const customer = await this.prisma.customer.findUnique({
        where: { id: dto.customerId },
      });

      if (!customer) {
        throw new NotFoundException('Customer not found');
      }

      const shipment = await this.prisma.shipment.create({
        data: {
          trackingCode,
          origin: dto.origin,
          destination: dto.destination,
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
        'Failed to create shipment',
      );
    }
  }

  async updateStatus(shipmentId: string, status: ShipmentStatus) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id: shipmentId },
    });

    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    if (
      shipment.status === ShipmentStatus.DELIVERED ||
      shipment.status === ShipmentStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'Cannot update a finished shipment',
      );
    }

    const updated = await this.prisma.shipment.update({
      where: { id: shipmentId },
      data: { status },
    });

    return updated;
  }

  async finishShipment(shipmentId: string, dto: FinishShipmentDto) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: { recipient: true },
    });

    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    if (shipment.status === ShipmentStatus.DELIVERED) {
      throw new BadRequestException('Shipment already delivered');
    }

    if (shipment.status === ShipmentStatus.CANCELLED) {
      throw new BadRequestException('Shipment is cancelled');
    }

    const recipient = await this.prisma.recipient.create({
      data: {
        shipmentId,
        name: dto.name,
        address: dto.address,
        phone: dto.phone,
      },
    });

    const updatedShipment = await this.prisma.shipment.update({
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

    return updatedShipment;
  }

  private generateTracking(): string {
    return (
      'BR' +
      Math.random().toString(36).substring(2, 10).toUpperCase()
    );
  }
}