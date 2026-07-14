import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ShipmentStatus } from 'src/enums/shipment-status.enum';

export class UpdateShipmentStatusDto {
    @ApiProperty({
        enum: ShipmentStatus,
        example: ShipmentStatus.IN_TRANSIT,
        description: 'Novo status da entrega',
    })
    @Type(() => Number)
    @IsInt()
    @IsEnum(ShipmentStatus)
    status!: ShipmentStatus;

    @ApiPropertyOptional({
        example: 'Terminal de Aracaju - SE',
        description: 'Local atual da encomenda',
    })
    @IsOptional()
    @IsString()
    location?: string;

    @ApiPropertyOptional({
        example: 'Encomenda saiu do centro de distribuição',
        description: 'Observação adicional',
    })
    @IsOptional()
    @IsString()
    description?: string;
}
