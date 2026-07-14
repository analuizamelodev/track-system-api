import {
    IsString,
    IsOptional,
    IsArray,
    ValidateNested,
    IsInt,
    ArrayMinSize,
    Min,
    IsNumber,
    IsIn,
    Length,
    Matches,
    MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceType } from 'src/enums/service-type.enum';

class AddressDto {
    @ApiProperty({ example: 'Rua das Flores' })
    @IsString()
    street!: string;

    @ApiProperty({ example: '123' })
    @IsString()
    number!: string;

    @ApiProperty({ example: 'Centro' })
    @IsString()
    neighborhood!: string;

    @ApiProperty({ example: 'Aracaju' })
    @IsString()
    city!: string;

    @ApiProperty({ example: 'SE', description: '2 letras (UF)' })
    @IsString()
    @Length(2, 2, { message: 'Estado deve ser a sigla UF com 2 caracteres' })
    state!: string;

    @ApiProperty({ example: '49000-000' })
    @IsString()
    @Matches(/^\d{5}-?\d{3}$/, { message: 'CEP inválido (use XXXXX-XXX ou XXXXXXXX)' })
    cep!: string;
}

class ShipmentItemDto {
    @ApiProperty({ example: 'Notebook' })
    @IsString()
    name!: string;

    @ApiProperty({ example: 1 })
    @IsInt()
    @Min(1)
    quantity!: number;

    @ApiPropertyOptional({ example: 'Dell i7' })
    @IsOptional()
    @IsString()
    description?: string;
}

export class CreateShipmentDto {
    @ApiProperty({ example: 'cliente-id-123' })
    @IsString()
    customerId!: string;

    @ApiProperty({ example: 'Carlos Silva', description: 'Nome do remetente' })
    @IsString()
    senderName!: string;

    @ApiProperty({ type: () => AddressDto, description: 'Endereço de origem' })
    @ValidateNested()
    @Type(() => AddressDto)
    origin!: AddressDto;

    @ApiProperty({ example: 'Maria Souza', description: 'Nome do destinatário' })
    @IsString()
    recipientName!: string;

    @ApiProperty({ type: () => AddressDto, description: 'Endereço de destino' })
    @ValidateNested()
    @Type(() => AddressDto)
    destination!: AddressDto;

    @ApiProperty({
        example: 1.5,
        description: 'Peso em kg',
    })
    @IsNumber({ maxDecimalPlaces: 3 })
    @Min(0.001, { message: 'Peso deve ser maior que 0' })
    weight!: number;

    @ApiProperty({
        enum: ServiceType,
        example: ServiceType.STANDARD,
        description: 'Tipo de serviço: EXPRESSO, PADRAO, ECONOMICO',
    })
    @IsIn(Object.values(ServiceType), { message: 'Tipo de serviço inválido' })
    serviceType!: ServiceType;

    @ApiPropertyOptional({ example: 'Frágil, manusear com cuidado' })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    notes?: string;

    @ApiProperty({
        description: 'Itens da encomenda (mínimo 1)',
        type: [ShipmentItemDto],
    })
    @IsArray()
    @ArrayMinSize(1, { message: 'É necessário pelo menos um item.' })
    @ValidateNested({ each: true })
    @Type(() => ShipmentItemDto)
    items!: ShipmentItemDto[];
}
