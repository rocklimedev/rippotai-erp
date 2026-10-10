import { RequirePermission } from '@/common/decorator/require-permission.decorator';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';

import { BudgetEstimateService } from './budget-estimate.service';

import { CreateBudgetEstimateDto } from './dto/create-budget-estimate.dto';
import { UpdateBudgetEstimateDto } from './dto/update-budget-estimate.dto';

@Controller('budget-estimates')
export class BudgetEstimateController {
  constructor(private readonly budgetEstimateService: BudgetEstimateService) {}

  // ============================================================
  // CREATE
  // POST /budget-estimates
  // ============================================================

  @RequirePermission('budget-estimates:create')
  @Post()
  create(@Body() dto: CreateBudgetEstimateDto, @Req() req: any) {
    return this.budgetEstimateService.create(dto, req.user?.id);
  }

  // ============================================================
  // CREATE FROM BOQ
  // POST /budget-estimates/from-boq/:boqId
  // ============================================================

  @RequirePermission('budget-estimates:create')
  @Post('from-boq/:boqId')
  createFromBoq(@Param('boqId', ParseUUIDPipe) boqId: string, @Req() req: any) {
    return this.budgetEstimateService.createFromBoq(boqId, req.user?.id);
  }

  // ============================================================
  // GET ALL
  // GET /budget-estimates
  // GET /budget-estimates?projectId=UUID
  // ============================================================

  @RequirePermission('budget-estimates:read')
  @Get()
  findAll(@Query('projectId') projectId?: string) {
    return this.budgetEstimateService.findAll(projectId);
  }

  // ============================================================
  // GET ONE
  // GET /budget-estimates/:id
  // ============================================================

  @RequirePermission('budget-estimates:read')
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.budgetEstimateService.findOne(id);
  }

  // ============================================================
  // UPDATE
  // PATCH /budget-estimates/:id
  // ============================================================

  @RequirePermission('budget-estimates:update')
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBudgetEstimateDto,
    @Req() req: any,
  ) {
    return this.budgetEstimateService.update(id, dto, req.user?.id);
  }

  // ============================================================
  // RECALCULATE
  // POST /budget-estimates/:id/recalculate
  // ============================================================

  @RequirePermission('budget-estimates:recalculate')
  @Post(':id/recalculate')
  recalculate(@Param('id', ParseUUIDPipe) id: string) {
    return this.budgetEstimateService.recalculate(id);
  }

  // ============================================================
  // LOCK
  // POST /budget-estimates/:id/lock
  // ============================================================

  @RequirePermission('budget-estimates:lock')
  @Post(':id/lock')
  lock(@Param('id', ParseUUIDPipe) id: string) {
    return this.budgetEstimateService.lock(id);
  }

  // ============================================================
  // UNLOCK
  // POST /budget-estimates/:id/unlock
  // ============================================================

  @RequirePermission('budget-estimates:lock')
  @Post(':id/unlock')
  unlock(@Param('id', ParseUUIDPipe) id: string) {
    return this.budgetEstimateService.unlock(id);
  }

  // ============================================================
  // DELETE
  // DELETE /budget-estimates/:id
  // ============================================================

  @RequirePermission('budget-estimates:delete')
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.budgetEstimateService.remove(id);
  }
}
