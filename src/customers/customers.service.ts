import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'src/database/prisma.service';
import { CustomerFieldChange, MailService } from 'src/mail/mail.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) { }

  async create(dto: CreateCustomerDto) {
    return this.prisma.customer.create({
      data: {
        name: dto.name,
        email: dto.email,
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
    const before = await this.findOne(id);

    const updated = await this.prisma.customer.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.document !== undefined && { document: dto.document }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
      },
    });

    // Computa apenas os campos que realmente mudaram
    const fieldDefs: Array<{ key: keyof UpdateCustomerDto; label: string }> = [
      { key: 'name', label: 'Nome' },
      { key: 'email', label: 'E-mail' },
      { key: 'phone', label: 'Telefone' },
      { key: 'document', label: 'Documento' },
    ];

    const changes: CustomerFieldChange[] = [];
    for (const { key, label } of fieldDefs) {
      const newVal = dto[key];
      const oldVal = before[key] ?? '';
      if (newVal !== undefined && newVal !== oldVal) {
        changes.push({ label, oldValue: String(oldVal || '—'), newValue: String(newVal || '—') });
      }
    }

    if (changes.length > 0) {
      // Se o e-mail mudou: notifica o e-mail antigo (quem precisa saber é quem tinha acesso à conta)
      // e também o novo (para que o cliente veja no novo endereço)
      const targets = new Set<string>();
      if (before.email) targets.add(before.email);
      if (dto.email && dto.email !== before.email) targets.add(dto.email);

      if (targets.size > 0) {
        this.logger.log(
          `[UpdateCustomer] Notificando "${[...targets].join(', ')}" — campos: ${changes.map((c) => c.label).join(', ')}`,
        );
        for (const target of targets) {
          await this.mailService.sendCustomerDataUpdated(target, updated.name, changes);
        }
      } else {
        this.logger.log(
          `[UpdateCustomer] Cliente "${updated.name}" (${id}) atualizado sem e-mail cadastrado — sem notificação.`,
        );
      }
    }

    return updated;
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.customer.delete({
      where: { id },
    });
  }
}
