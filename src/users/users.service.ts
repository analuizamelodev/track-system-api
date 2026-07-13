import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService) { }

    async findUserByEmail(email: string) {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }

    async createUser(
        name: string,
        email: string,
        password: string,
    ) {
        return this.prisma.user.create({
            data: {
                name,
                email,
                password,
            },
        });
    }
}