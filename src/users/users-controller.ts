import {
    Body,
    Controller,
    Get,
    Param,
    Patch,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { UserRole } from 'src/enums/user-role.enum';
import { ApiBearerAuth } from '@nestjs/swagger';

const ALL_ROLES = [UserRole.ADMIN, UserRole.OPERATOR];

@ApiBearerAuth('access-token')
@Controller('users')
@UseGuards(AuthGuard, RolesGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    // ── Admin only ──────────────────────────────────────────────────

    @Post()
    @Roles(UserRole.ADMIN)
    create(@Body() registerUserDto: RegisterUserDto) {
        return this.usersService.create(registerUserDto);
    }

    @Get()
    @Roles(UserRole.ADMIN)
    findAll() {
        return this.usersService.findAll();
    }

    @Get(':id')
    @Roles(UserRole.ADMIN)
    findOne(@Param('id') id: string) {
        return this.usersService.findOne(id);
    }

    /** Admin pode atualizar nome, email, role e active de qualquer usuário */
    @Patch(':id')
    @Roles(UserRole.ADMIN)
    update(@Param('id') id: string, @Body() dto: UpdateUserDto, @Req() req) {
        return this.usersService.update(id, dto, req.user.sub);
    }

    @Post(':id/reset-password')
    @Roles(UserRole.ADMIN)
    resetPassword(@Param('id') id: string) {
        return this.usersService.resetPassword(id);
    }

    // ── Any authenticated user ──────────────────────────────────────

    /** Trocar a própria senha (obrigatório ao usar senha temporária) */
    @Patch('me/password')
    @Roles(...ALL_ROLES)
    changePassword(@Req() req, @Body() dto: ChangePasswordDto) {
        return this.usersService.changePassword(req.user.sub, dto);
    }

}
