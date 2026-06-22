import { IsEnum } from 'class-validator';
import { ShipmentStatus } from 'src/generated/enums';

export class UpdateShipmentStatusDto {

    @IsEnum(ShipmentStatus)
    status!: ShipmentStatus;

}