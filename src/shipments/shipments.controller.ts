import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ShipmentsService } from './shipments.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { Req } from '@nestjs/common';

@Controller('shipments')
export class ShipmentsController {
  constructor(private readonly shipmentsService: ShipmentsService) { }

  @UseGuards(AuthGuard)
  @Post()
  createShipment(@Body() createShipmentDto: CreateShipmentDto, @Req() req) {
    const userId = req.user.id;
    return this.shipmentsService.create(createShipmentDto, userId);
  }
}
