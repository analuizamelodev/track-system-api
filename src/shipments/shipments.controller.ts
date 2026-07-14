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

@ApiBearerAuth('access-token')
@Controller('shipments')
@UseGuards(AuthGuard, RolesGuard)
export class ShipmentsController {

  constructor(
    private readonly shipmentsService: ShipmentsService,
  ) { }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
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

  @Get()
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  findAll(@Query() query: ListShipmentsQueryDto) {
    return this.shipmentsService.findAll(query);
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

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  findOne(@Param('id') id: string) {
    return this.shipmentsService.findOne(id);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
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
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  finish(
    @Param('id') id: string,
    @Body() dto: FinishShipmentDto,
  ) {
    return this.shipmentsService.finishShipment(
      id,
      dto,
    );
  }

  @Patch(':id/cancel')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  cancel(@Param('id') id: string) {
    return this.shipmentsService.cancelShipment(id);
  }
}
