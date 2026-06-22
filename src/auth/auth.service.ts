import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(private readonly usersService: UsersService, private readonly jwtService: JwtService) { }

    async register(registerDto: RegisterDto) {
        const existingUser = await this.usersService.findUserByEmail(registerDto.email);
        if (existingUser) {
            throw new ConflictException();
        }
        await this.usersService.createUser(registerDto.name, registerDto.email, registerDto.password);
    }

    async login(loginDto: LoginDto) {
        const user = await this.usersService.findUserByEmail(loginDto.email);
        if (!user) {
            throw new UnauthorizedException();
        }
        const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
        if (!isPasswordValid) {
            throw new BadRequestException();
        }
        const payload = { sub: user.id, email: user.email, name: user.name };
        return {

            access_token: await this.jwtService.signAsync(payload),
        };
    }
}