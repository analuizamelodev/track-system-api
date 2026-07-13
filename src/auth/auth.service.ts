import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
    ) { }

    async register(registerDto: RegisterDto) {
        const existingUser = await this.usersService.findUserByEmail(
            registerDto.email,
        );

        if (existingUser) {
            throw new ConflictException(
                'Usuário já cadastrado',
            );
        }

        const hashedPassword = await bcrypt.hash(
            registerDto.password,
            10,
        );

        await this.usersService.createUser(
            registerDto.name,
            registerDto.email,
            hashedPassword,
        );

        return {
            message: 'Usuário criado com sucesso',
        };
    }

    async login(loginDto: LoginDto) {
        console.log("Dados recebidos:", loginDto);

        const user = await this.usersService.findUserByEmail(
            loginDto.email,
        );

        console.log("Usuário encontrado:", user);

        if (!user) {
            throw new UnauthorizedException(
                'Email ou senha inválidos',
            );
        }

        const isPasswordValid = await bcrypt.compare(
            loginDto.password,
            user.password,
        );

        console.log("Senha válida:", isPasswordValid);

        if (!isPasswordValid) {
            throw new UnauthorizedException(
                'Email ou senha inválidos',
            );
        }

        const payload = {
            sub: user.id,
            email: user.email,
            name: user.name,
        };

        return {
            access_token: await this.jwtService.signAsync(payload),
        };
    }
}