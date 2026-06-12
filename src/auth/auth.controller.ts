import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ApiOkResponse } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {

    constructor(private readonly authService: AuthService) { }

    @Post('login')
    login(@Body() loginDto: LoginDto) {
        this.authService.login(loginDto);
    }

    @Post('register')
    register(@Body() registerDto: RegisterDto) {
        this.authService.register(registerDto);
    }
}
