import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class ListShipmentsQueryDto {
    @ApiPropertyOptional({ description: 'Filtrar por status' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    status?: number;

    @ApiPropertyOptional({ description: 'Filtrar por cliente' })
    @IsOptional()
    @IsString()
    customerId?: string;
}
