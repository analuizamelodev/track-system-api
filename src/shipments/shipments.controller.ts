import {
  Body,
  Controller,
  Param,
  Patch,
  Post,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ShipmentsService } from './shipments.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { FinishShipmentDto } from './dto/finish-shipment.dto';
import { UpdateShipmentStatusDto } from './dto/update-shipment-status.dto';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth('access-token')
@Controller('shipments')
@UseGuards(AuthGuard)
export class ShipmentsController {

  constructor(
    private readonly shipmentsService: ShipmentsService,
  ) { }

  @Post()
  createShipment(
    @Body() dto: CreateShipmentDto,
    @Req() req,
  ) {
    console.log('REQ USER:', req.user);
    const userId = req.user.sub;

    return this.shipmentsService.create(
      dto,
      userId,
    );
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateShipmentStatusDto,
  ) {
    return this.shipmentsService.updateStatus(
      id,
      dto.status,
    );
  }

  @Patch(':id/finish')
  finishShipment(
    @Param('id') id: string,
    @Body() dto: FinishShipmentDto,
  ) {
    return this.shipmentsService.finishShipment(
      id,
      dto,
    );
  }
}