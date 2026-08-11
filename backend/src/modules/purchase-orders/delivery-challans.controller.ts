import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';

import { DeliveryChallansService } from './delivery-challans.service';
import { CreateDeliveryChallanDto } from './dto/delivery-challan.dto';

@Controller('delivery-challans')
export class DeliveryChallansController {
  constructor(private readonly service: DeliveryChallansService) {}

  @Get()
  findAll(
    @Query('purchaseOrderId') purchaseOrderId?: string,
    @Query('projectId') projectId?: string,
  ) {
    return this.service.findAll(purchaseOrderId, projectId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateDeliveryChallanDto) {
    return this.service.create(dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
