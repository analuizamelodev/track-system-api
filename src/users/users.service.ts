import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { PrismaService } from 'src/database/prisma.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from 'src/enums/user-role.enum';
import { MailService } from 'src/mail/mail.service';
import {
    generateTemporaryPassword,
    sanitizeUser,
} from 'src/utils/user.util';

@Injectable()
export class UsersService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly mailService: MailService,
    ) { }

    async findUserByEmail(email: string) {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }

    async findAll() {
        const users = await this.prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
        });

        return users.map(sanitizeUser);
    }

    async findOne(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
        });

        if (!user) {
            throw new NotFoundException('Usuário não encontrado');
        }

        return sanitizeUser(user);
    }

    async create(registerUserDto: RegisterUserDto) {
        const existingUser = await this.findUserByEmail(
            registerUserDto.email,
        );

        if (existingUser) {
            throw new ConflictException(
                'Usuário já cadastrado',
            );
        }

        const temporaryPassword = generateTemporaryPassword();

        const hashedPassword = await bcrypt.hash(
            temporaryPassword,
            10,
        );

        const createdUser = await this.prisma.user.create({
            data: {
                name: registerUserDto.name,
                email: registerUserDto.email,
                password: hashedPassword,
                role: registerUserDto.role ?? UserRole.OPERATOR,
                active: true,
            },
        });

        await this.mailService.sendWelcomeEmail(
            createdUser.email,
            temporaryPassword,
        );

        return {
            message: 'Usuário criado com sucesso. Credenciais enviadas por e-mail.',
            user: sanitizeUser(createdUser),
        };
    }

    async update(id: string, dto: UpdateUserDto) {
        await this.findOne(id);

        const updatedUser = await this.prisma.user.update({
            where: { id },
            data: {
                ...(dto.name !== undefined && { name: dto.name }),
                ...(dto.role !== undefined && { role: dto.role }),
                ...(dto.active !== undefined && { active: dto.active }),
            },
        });

        return {
            message: 'Usuário atualizado com sucesso.',
            user: sanitizeUser(updatedUser),
        };
    }

    async resetPassword(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
        });

        if (!user) {
            throw new NotFoundException('Usuário não encontrado');
        }

        const temporaryPassword = generateTemporaryPassword();

        const hashedPassword = await bcrypt.hash(
            temporaryPassword,
            10,
        );

        await this.prisma.user.update({
            where: { id },
            data: { password: hashedPassword },
        });

        await this.mailService.sendWelcomeEmail(
            user.email,
            temporaryPassword,
        );

        return {
            message: 'Nova senha enviada por e-mail.',
        };
    }
}
