import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { LoginDto } from './dto/login.dto';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
    ) { }

    async login(loginDto: LoginDto) {
        const user = await this.usersService.findUserByEmail(loginDto.email);

        if (!user) {
            throw new UnauthorizedException('Email ou senha inválidos');
        }

        if (!user.active) {
            throw new UnauthorizedException('Usuário desativado');
        }

        const isPasswordValid = await bcrypt.compare(
            loginDto.password,
            user.password,
        );

        if (!isPasswordValid) {
            throw new UnauthorizedException('Email ou senha inválidos');
        }

        const payload = {
            sub: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
        };

        return {
            access_token: await this.jwtService.signAsync(payload),
            isTempPassword: user.isTempPassword,
        };
    }
}