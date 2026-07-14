import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import * as bcrypt from 'bcrypt';
import { UserRole } from 'src/enums/user-role.enum';

@Injectable()
export class SetupService implements OnModuleInit {
    constructor(
        private readonly prisma: PrismaService,
    ) { }

    async onModuleInit() {
        const admin = await this.prisma.user.findUnique({
            where: {
                email: process.env.DEFAULT_ADMIN_EMAIL!,
            },
        });

        if (admin) {
            console.log('Administrador já existe.');
            return;
        }

        const password = await bcrypt.hash(
            process.env.DEFAULT_ADMIN_PASSWORD!,
            10,
        );

        await this.prisma.user.create({
            data: {
                name: process.env.DEFAULT_ADMIN_NAME!,
                email: process.env.DEFAULT_ADMIN_EMAIL!,
                password,
                role: UserRole.ADMIN,
                active: true,
            },
        });

        console.log('Administrador criado com sucesso!');
    }
}