import {
  Body,
  Controller,
  Param,
  Patch,
  Post,
  UseGuards,
  Req,
  Get,
} from '@nestjs/common';
import { ShipmentsService } from './shipments.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { FinishShipmentDto } from './dto/finish-shipment.dto';
import { UpdateShipmentStatusDto } from './dto/update-shipment-status.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Public } from 'src/auth/public.decorator';

@ApiBearerAuth('access-token')
@Controller('shipments')
@UseGuards(AuthGuard)
export class ShipmentsController {

  constructor(
    private readonly shipmentsService: ShipmentsService,
  ) { }

  @Post()
  create(
    @Body() dto: CreateShipmentDto,
    @Req() req,
  ) {
    const userId = req.user.sub;

    return this.shipmentsService.create(
      dto,
      userId,
    );
  }

  @Patch(':id/status')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateShipmentStatusDto,
  ) {
    return this.shipmentsService.updateStatus(
      id,
      dto.status,
    );
  }

  @Patch(':id/finish')
  finish(
    @Param('id') id: string,
    @Body() dto: FinishShipmentDto,
  ) {
    return this.shipmentsService.finishShipment(
      id,
      dto,
    );
  }

  @Get('tracking/:trackingCode')
  @Public()
  findByTrackingCode(
    @Param('trackingCode') trackingCode: string,
  ) {
    return this.shipmentsService.findByTrackingCode(
      trackingCode,
    );
  }
}