import { IsEmail, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCustomerDto {
    @ApiProperty({
        example: 'Maria Silva',
        description: 'Nome completo do cliente',
    })
    @IsString()
    name!: string;

    @ApiPropertyOptional({
        example: 'maria@email.com',
        description: 'E-mail do cliente para notificações de rastreio',
    })
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiPropertyOptional({
        example: '12345678900',
        description: 'Documento (CPF ou outro identificador)',
    })
    @IsOptional()
    @IsString()
    document?: string;

    @ApiPropertyOptional({
        example: '+55 79 99999-9999',
        description: 'Telefone do cliente',
    })
    @IsOptional()
    @IsString()
    phone?: string;
}
