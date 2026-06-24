import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'src/database/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomerService {
  constructor(
    private readonly prisma: PrismaService,
  ) { }

  async create(dto: CreateCustomerDto) {
    return this.prisma.customer.create({
      data: {
        name: dto.name,
        document: dto.document,
        phone: dto.phone,
      },
    });
  }

  async findAll() {
    return this.prisma.customer.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        shipments: true,
      },
    });

    if (!customer) {
      throw new NotFoundException('Cliente não encontrado');
    }

    return customer;
  }

  async update(id: string, dto: UpdateCustomerDto) {
    await this.findOne(id);

    return this.prisma.customer.update({
      where: { id },
      data: {
        name: dto.name,
        document: dto.document,
        phone: dto.phone,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.customer.delete({
      where: { id },
    });
  }
}