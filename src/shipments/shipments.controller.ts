import {
    Body,
    Controller,
    Param,
    Patch,
    Post,
    UseGuards,
    Req,
    Get,
    Query,
} from '@nestjs/common';
import { ShipmentsService } from './shipments.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { FinishShipmentDto } from './dto/finish-shipment.dto';
import { UpdateShipmentStatusDto } from './dto/update-shipment-status.dto';
import { ListShipmentsQueryDto } from './dto/list-shipments-query.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Public } from 'src/auth/public.decorator';
import { UserRole } from 'src/enums/user-role.enum';

const ALL_INTERNAL = [UserRole.ADMIN, UserRole.OPERATOR];

@ApiBearerAuth('access-token')
@Controller('shipments')
@UseGuards(AuthGuard, RolesGuard)
export class ShipmentsController {
    constructor(
        private readonly shipmentsService: ShipmentsService,
    ) { }

    @Post()
    @Roles(...ALL_INTERNAL)
    create(@Body() dto: CreateShipmentDto, @Req() req) {
        return this.shipmentsService.create(dto, req.user.sub);
    }

    @Get()
    @Roles(...ALL_INTERNAL)
    findAll(@Query() query: ListShipmentsQueryDto) {
        return this.shipmentsService.findAll(query);
    }

    @Get('tracking/:trackingCode')
    @Public()
    findByTrackingCode(@Param('trackingCode') trackingCode: string) {
        return this.shipmentsService.findByTrackingCode(trackingCode);
    }

    @Get(':id')
    @Roles(...ALL_INTERNAL)
    findOne(@Param('id') id: string) {
        return this.shipmentsService.findOne(id);
    }

    @Patch(':id/status')
    @Roles(...ALL_INTERNAL)
    updateStatus(
        @Param('id') id: string,
        @Body() dto: UpdateShipmentStatusDto,
        @Req() req,
    ) {
        return this.shipmentsService.updateStatus(
            id,
            dto.status,
            req.user.sub,
            dto.location,
            dto.description,
        );
    }

    @Patch(':id/finish')
    @Roles(...ALL_INTERNAL)
    finish(
        @Param('id') id: string,
        @Body() dto: FinishShipmentDto,
        @Req() req,
    ) {
        return this.shipmentsService.finishShipment(id, dto, req.user.sub);
    }

    @Patch(':id/cancel')
    @Roles(...ALL_INTERNAL)
    cancel(@Param('id') id: string, @Req() req) {
        return this.shipmentsService.cancelShipment(id, req.user.sub);
    }
}
