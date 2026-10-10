import { RequirePermission } from '@/common/decorator/require-permission.decorator';
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

  @RequirePermission('delivery-challans:create')
  @Post()
  create(
    @Body()
    dto: CreateDeliveryChallanDto,
    @Req() req: any,
  ) {
    return this.deliveryChallanService.create(dto, req.user?.id);
  }

  @RequirePermission('delivery-challans:read')
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
  @RequirePermission('delivery-challans:delete')
  @Delete(':id') remove(@Param('id') id: string) {
    return this.deliveryChallanService.remove(id);
  }
  @RequirePermission('delivery-challans:read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.deliveryChallanService.findOne(id);
  }

  @RequirePermission('delivery-challans:update')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDeliveryChallanDto) {
    return this.deliveryChallanService.update(id, dto);
  }

  @RequirePermission('delivery-challans:receive')
  @Post(':id/receive')
  receive(@Param('id') id: string, @Req() req: any) {
    return this.deliveryChallanService.receive(id, req.user?.id);
  }
}
