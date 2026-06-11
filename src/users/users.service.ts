import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService) { }

    async findUserByEmail(email: string) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        return user;
    }

    async createUser(name: string, email: string, password: string) {

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await this.prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
        });
        return user;
    }

}
