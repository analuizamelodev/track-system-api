import { IsEmail, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCustomerDto {
    @ApiPropertyOptional({
        example: 'João Silva',
        description: 'Nome do cliente',
    })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional({
        example: 'joao@email.com',
        description: 'E-mail do cliente',
    })
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiPropertyOptional({
        example: '123.456.789-00',
        description: 'CPF ou documento do cliente',
    })
    @IsOptional()
    @IsString()
    document?: string;

    @ApiPropertyOptional({
        example: '(79) 99999-9999',
        description: 'Telefone do cliente',
    })
    @IsOptional()
    @IsString()
    phone?: string;
}
