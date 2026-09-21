import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Delete,
  Query,
  Req,
} from '@nestjs/common';

import { DeliveryChallanService } from '../services/delivery-challan.service';

import {
  CreateDeliveryChallanDto,
  UpdateDeliveryChallanDto,
} from '../dto/delivery-challan.dto';

@Controller('delivery-challans')
export class DeliveryChallanController {
  constructor(
    private readonly deliveryChallanService: DeliveryChallanService,
  ) {}

  @Post()
  create(
    @Body()
    dto: CreateDeliveryChallanDto,
    @Req() req: any,
  ) {
    return this.deliveryChallanService.create(dto, req.user?.id);
  }

  @Get()
  findAll(
    @Query('projectId') projectId?: string,
    @Query('purchaseOrderId')
    purchaseOrderId?: string,
    @Query('vendorId') vendorId?: string,
    @Query('status') status?: string,
  ) {
    return this.deliveryChallanService.findAll({
      projectId,
      purchaseOrderId,
      vendorId,
      status,
    });
  }
  // ============================================================ // DELETE // ============================================================
  @Delete(':id') remove(@Param('id') id: string) {
    return this.deliveryChallanService.remove(id);
  }
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.deliveryChallanService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDeliveryChallanDto) {
    return this.deliveryChallanService.update(id, dto);
  }

  @Post(':id/receive')
  receive(@Param('id') id: string, @Req() req: any) {
    return this.deliveryChallanService.receive(id, req.user?.id);
  }
}
