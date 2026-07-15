import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiPropertyOptional({
        example: 2,
        description: 'Role do usuário: 1 = ADMIN, 2 = OPERATOR',
    })
    @IsOptional()
    @IsInt()
    role?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    active?: boolean;
}
