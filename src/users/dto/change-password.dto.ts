import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
    @ApiPropertyOptional({
        description: 'Senha atual (obrigatória quando não é senha temporária)',
    })
    @IsOptional()
    @IsString()
    currentPassword?: string;

    @ApiProperty({ description: 'Nova senha (mínimo 6 caracteres)' })
    @IsString()
    @MinLength(6, { message: 'A nova senha deve ter no mínimo 6 caracteres' })
    newPassword: string;

    @ApiProperty({ description: 'Confirmação da nova senha' })
    @IsString()
    confirmPassword: string;
}
