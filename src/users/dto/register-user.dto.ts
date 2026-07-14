import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsInt, IsOptional, IsString } from 'class-validator';

export class RegisterUserDto {
    @ApiProperty()
    @IsString()
    name!: string;

    @ApiProperty()
    @IsEmail()
    email!: string;

    @ApiPropertyOptional({
        example: 2,
        description: 'Role do usuário: 1 = ADMIN, 2 = OPERATOR (padrão)',
    })
    @IsOptional()
    @IsInt()
    role?: number;
}
