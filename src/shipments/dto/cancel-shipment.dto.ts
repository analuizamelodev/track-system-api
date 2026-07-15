import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelShipmentDto {
    @ApiPropertyOptional({
        example: 'Cliente solicitou cancelamento',
        description: 'Motivo do cancelamento',
    })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    description?: string;

    @ApiPropertyOptional({
        example: 'Unidade de Aracaju - SE',
        description: 'Local onde o cancelamento foi registrado',
    })
    @IsOptional()
    @IsString()
    location?: string;
}
