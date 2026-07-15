import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { PrismaService } from 'src/database/prisma.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserRole } from 'src/enums/user-role.enum';
import { MailService } from 'src/mail/mail.service';
import {
    generateTemporaryPassword,
    sanitizeUser,
} from 'src/utils/user.util';

@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly mailService: MailService,
    ) { }

    async findUserByEmail(email: string) {
        return this.prisma.user.findUnique({ where: { email } });
    }

    async findAll() {
        const users = await this.prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return users.map(sanitizeUser);
    }

    async findOne(id: string) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) throw new NotFoundException('Usuário não encontrado');
        return sanitizeUser(user);
    }

    async create(registerUserDto: RegisterUserDto) {
        const existingUser = await this.findUserByEmail(registerUserDto.email);
        if (existingUser) throw new ConflictException('Usuário já cadastrado');

        const temporaryPassword = generateTemporaryPassword();
        const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

        const createdUser = await this.prisma.user.create({
            data: {
                name: registerUserDto.name,
                email: registerUserDto.email,
                password: hashedPassword,
                role: registerUserDto.role ?? UserRole.OPERATOR,
                active: true,
                isTempPassword: true,
            },
        });

        await this.mailService.sendWelcomeEmail(createdUser.email, temporaryPassword);

        return {
            message: 'Usuário criado com sucesso. Credenciais enviadas por e-mail.',
            user: sanitizeUser(createdUser),
        };
    }

    async update(id: string, dto: UpdateUserDto, requesterId?: string) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) throw new NotFoundException('Usuário não encontrado');

        // Conta de admin nunca pode ser desativada
        if (dto.active === false && user.role === UserRole.ADMIN) {
            throw new ForbiddenException('A conta de um administrador não pode ser desativada');
        }

        // Verifica conflito de email
        if (dto.email && dto.email !== user.email) {
            const conflict = await this.findUserByEmail(dto.email);
            if (conflict) throw new ConflictException('Este email já está em uso');
        }

        const updatedUser = await this.prisma.user.update({
            where: { id },
            data: {
                ...(dto.name !== undefined && { name: dto.name }),
                ...(dto.email !== undefined && { email: dto.email }),
                ...(dto.role !== undefined && { role: dto.role }),
                ...(dto.active !== undefined && { active: dto.active }),
            },
        });

        // Notifica o operador se nome ou email foram alterados por outro usuário (admin)
        const changedByOther = requesterId && requesterId !== id;
        const nameChanged = dto.name !== undefined && dto.name !== user.name;
        const emailChanged = dto.email !== undefined && dto.email !== user.email;

        if (changedByOther && nameChanged) {
            // Nome alterado → notifica no e-mail atual (antes da mudança)
            this.logger.log(
                `[UpdateUser] Admin "${requesterId}" alterou nome de "${user.email}": "${user.name}" → "${dto.name}"`,
            );
            await this.mailService.sendOperatorNameChanged(
                user.email,
                user.name,
                updatedUser.name,
            );
        }

        if (changedByOther && emailChanged && dto.email) {
            // E-mail alterado → notifica no NOVO e-mail
            this.logger.log(
                `[UpdateUser] Admin "${requesterId}" alterou e-mail do operador "${user.name}": "${user.email}" → "${dto.email}"`,
            );
            await this.mailService.sendOperatorEmailChanged(
                dto.email,
                updatedUser.name,
            );
        }

        return {
            message: 'Usuário atualizado com sucesso.',
            user: sanitizeUser(updatedUser),
        };
    }

    async resetPassword(id: string) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) throw new NotFoundException('Usuário não encontrado');

        const temporaryPassword = generateTemporaryPassword();
        const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

        await this.prisma.user.update({
            where: { id },
            data: {
                password: hashedPassword,
                isTempPassword: true,
            },
        });

        await this.mailService.sendPasswordReset(
            user.email,
            temporaryPassword,
            user.name,
        );

        return { message: 'Nova senha temporária enviada por e-mail.' };
    }

    async changePassword(userId: string, dto: ChangePasswordDto) {
        if (dto.newPassword !== dto.confirmPassword) {
            throw new BadRequestException('As senhas não coincidem');
        }

        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('Usuário não encontrado');

        // Se não é senha temporária, exige a senha atual
        if (!user.isTempPassword) {
            if (!dto.currentPassword) {
                throw new BadRequestException('Informe a senha atual');
            }
            const isValid = await bcrypt.compare(dto.currentPassword, user.password);
            if (!isValid) {
                throw new ForbiddenException('Senha atual incorreta');
            }
        }

        const hashed = await bcrypt.hash(dto.newPassword, 10);

        await this.prisma.user.update({
            where: { id: userId },
            data: {
                password: hashed,
                isTempPassword: false,
            },
        });

        return { message: 'Senha alterada com sucesso.' };
    }

}
