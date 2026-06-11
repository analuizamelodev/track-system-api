import { Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(private readonly usersService: UsersService) { }

    async register(registerDto: RegisterDto) {
        const existingUser = await this.usersService.findUserByEmail(registerDto.email);
        if (existingUser) {
            throw new Error('User with this email already exists');
        }
        const user = await this.usersService.createUser(registerDto.name, registerDto.email, registerDto.password);
        return user;
    }

    async login(loginDto: LoginDto) {
        const user = await this.usersService.findUserByEmail(loginDto.email);
        if (!user) {
            throw new Error('Invalid email or password');
        }
        const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
        if (!isPasswordValid) {
            throw new Error('Invalid email or password');
        }
        return user;
    }
}