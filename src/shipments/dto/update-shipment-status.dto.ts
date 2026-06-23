import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt } from 'class-validator';
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

}