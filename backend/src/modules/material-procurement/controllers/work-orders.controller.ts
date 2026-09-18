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

  @Post()
  create(@Body() dto: CreateWorkOrderDto) {
    return this.workOrdersService.create(dto);
  }

  // ============================================================
  // LIST
  // GET /api/v1/work-orders
  // ============================================================

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
  // GET
  // GET /api/v1/work-orders/:id
  // ============================================================

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.workOrdersService.findOne(id);
  }

  // ============================================================
  // UPDATE
  // PATCH /api/v1/work-orders/:id
  // ============================================================

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateWorkOrderDto) {
    return this.workOrdersService.update(id, dto);
  }

  // ============================================================
  // STATUS
  // PATCH /api/v1/work-orders/:id/status
  // ============================================================

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: WorkOrderStatus,
  ) {
    return this.workOrdersService.updateStatus(id, status);
  }

  // ============================================================
  // DELETE
  // DELETE /api/v1/work-orders/:id
  // ============================================================

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.workOrdersService.remove(id);
  }
}
