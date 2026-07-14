import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length, Matches, MinLength } from 'class-validator';

export class FinishShipmentDto {
    @ApiProperty({
        example: 'João da Silva',
        description: 'Nome de quem assinou/recebeu a entrega',
    })
    @IsString()
    @MinLength(3)
    signedName!: string;

    @ApiProperty({
        example: '49000-000',
        description: 'CEP do local de entrega — deve ser igual ao CEP de destino cadastrado',
    })
    @IsString()
    @Matches(/^\d{5}-?\d{3}$/, { message: 'CEP inválido' })
    deliveryCep!: string;

    @ApiPropertyOptional({ example: '79999999999' })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiPropertyOptional({
        example: 'Residência do destinatário',
        description: 'Local onde a entrega foi realizada',
    })
    @IsOptional()
    @IsString()
    location?: string;
}
