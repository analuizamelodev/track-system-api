import {
    IsString,
    IsOptional,
    MinLength,
} from 'class-validator';
import {
    ApiProperty,
    ApiPropertyOptional,
} from '@nestjs/swagger';

export class FinishShipmentDto {
    @ApiProperty({
        example: 'João da Silva',
        description: 'Nome de quem recebeu a entrega',
    })
    @IsString()
    @MinLength(3)
    name!: string;


    @ApiProperty({
        example: 'Rua das Flores, 123 - Aracaju/SE',
        description: 'Endereço onde a entrega foi recebida',
    })
    @IsString()
    @MinLength(5)
    address!: string;


    @ApiPropertyOptional({
        example: '79999999999',
        description: 'Telefone do destinatário',
    })
    @IsOptional()
    @IsString()
    phone?: string;
}