import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FinishShipmentDto {
    @ApiProperty()
    @IsString()
    name!: string;

    @ApiProperty()
    @IsString()
    address!: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    phone?: string;
}