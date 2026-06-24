import {
    IsString,
    IsOptional,
    IsArray,
    ValidateNested,
    IsInt,
    ArrayMinSize,
    Min,
} from 'class-validator';

import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class ShipmentItemDto {
    @ApiProperty({
        example: 'Notebook',
        description: 'Nome do item enviado',
    })
    @IsString()
    name!: string;

    @ApiProperty({
        example: 1,
        description: 'Quantidade do item (mínimo 1)',
    })
    @IsInt()
    @Min(1)
    quantity!: number;

    @ApiPropertyOptional({
        example: 'Notebook Dell i7',
        description: 'Descrição opcional do item',
    })
    @IsOptional()
    @IsString()
    description?: string;
}

export class CreateShipmentDto {
    @ApiProperty({
        example: 'cliente-id-123',
        description: 'ID do cliente que está solicitando o envio',
    })
    @IsString()
    customerId!: string;

    @ApiProperty({
        example: 'Aracaju - SE',
        description: 'Local de origem da encomenda',
    })
    @IsString()
    origin!: string;

    @ApiProperty({
        example: 'São Paulo - SP',
        description: 'Destino da encomenda',
    })
    @IsString()
    destination!: string;

    @ApiPropertyOptional({
        example: 'Encomenda frágil',
        description: 'Observações opcionais do envio',
    })
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiProperty({
        description: 'Lista de itens da encomenda (mínimo 1 item)',
        type: [ShipmentItemDto],
        example: [
            {
                name: 'Notebook',
                quantity: 1,
                description: 'Dell i7',
            },
        ],
    })
    @IsArray()
    @ArrayMinSize(1, {
        message: 'É necessário pelo menos um item para o envio.',
    })
    @ValidateNested({ each: true })
    @Type(() => ShipmentItemDto)
    items!: ShipmentItemDto[];
}