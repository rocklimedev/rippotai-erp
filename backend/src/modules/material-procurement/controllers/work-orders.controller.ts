import { RequirePermission } from '@/common/decorator/require-permission.decorator';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { WorkOrdersService } from '../services/work-orders.service';
import { CreateWorkOrderDto } from '../dto/create-work-order.dto';
import { UpdateWorkOrderDto } from '../dto/update-work-order.dto';
import { WorkOrderStatus } from '@/common/enums/work-order.enums';

@Controller('work-orders')
export class WorkOrdersController {
  constructor(private readonly workOrdersService: WorkOrdersService) {}

  // ============================================================
  // CREATE
  // POST /api/v1/work-orders
  // ============================================================

  @RequirePermission('work-orders:create')
  @Post()
  create(@Body() dto: CreateWorkOrderDto) {
    return this.workOrdersService.create(dto);
  }

  // ============================================================
  // LIST
  // GET /api/v1/work-orders
  //
  // Optional filters:
  // ?project_id=xxx
  // ?vendor_id=xxx
  // ?status=DRAFT
  // ============================================================

  @RequirePermission('work-orders:read')
  @Get()
  findAll(
    @Query('project_id') project_id?: string,
    @Query('vendor_id') vendor_id?: string,
    @Query('status') status?: WorkOrderStatus,
  ) {
    return this.workOrdersService.findAll({
      project_id,
      vendor_id,
      status,
    });
  }

  // ============================================================
  // GET DETAIL
  // GET /api/v1/work-orders/:id
  // ============================================================

  @RequirePermission('work-orders:read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.workOrdersService.findOne(id);
  }

  // ============================================================
  // UPDATE
  // PATCH /api/v1/work-orders/:id
  // ============================================================

  @RequirePermission('work-orders:update')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateWorkOrderDto) {
    return this.workOrdersService.update(id, dto);
  }

  // ============================================================
  // UPDATE STATUS
  // PATCH /api/v1/work-orders/:id/status
  //
  // Body:
  // {
  //   "status": "APPROVED"
  // }
  // ============================================================

  @RequirePermission('work-orders:update')
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: WorkOrderStatus,
  ) {
    return this.workOrdersService.updateStatus(id, status);
  }

  // ============================================================
  // APPROVE
  // PATCH /api/v1/work-orders/:id/approve
  // ============================================================

  @RequirePermission('work-orders:approve')
  @Patch(':id/approve')
  approve(@Param('id') id: string) {
    return this.workOrdersService.updateStatus(id, WorkOrderStatus.APPROVED);
  }

  // ============================================================
  // REJECT
  // PATCH /api/v1/work-orders/:id/reject
  //
  // Body:
  // {
  //   "reason": "Commercial terms need revision"
  // }
  //
  // NOTE:
  // There is currently no REJECTED value in WorkOrderStatus.
  // Therefore rejection is handled according to the service logic.
  // If rejected work orders need a dedicated status, add REJECTED
  // to WorkOrderStatus and use it here.
  // ============================================================

  @RequirePermission('work-orders:reject')
  @Patch(':id/reject')
  reject(@Param('id') id: string, @Body('reason') reason?: string) {
    return this.workOrdersService.reject(id, reason);
  }

  // ============================================================
  // DELETE
  // DELETE /api/v1/work-orders/:id
  // ============================================================

  @RequirePermission('work-orders:delete')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.workOrdersService.remove(id);
  }
}
