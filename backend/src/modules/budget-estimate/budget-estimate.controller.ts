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

  @Post()
  create(@Body() dto: CreateBudgetEstimateDto, @Req() req: any) {
    return this.budgetEstimateService.create(dto, req.user?.id);
  }

  // ============================================================
  // CREATE FROM BOQ
  // POST /budget-estimates/from-boq/:boqId
  // ============================================================

  @Post('from-boq/:boqId')
  createFromBoq(@Param('boqId', ParseUUIDPipe) boqId: string, @Req() req: any) {
    return this.budgetEstimateService.createFromBoq(boqId, req.user?.id);
  }

  // ============================================================
  // GET ALL
  // GET /budget-estimates
  // GET /budget-estimates?projectId=xxx
  // ============================================================

  @Get()
  findAll(@Query('projectId') projectId?: string) {
    return this.budgetEstimateService.findAll(projectId);
  }

  // ============================================================
  // GET ONE
  // ============================================================

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.budgetEstimateService.findOne(id);
  }

  // ============================================================
  // UPDATE
  // ============================================================

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
  // ============================================================

  @Post(':id/recalculate')
  recalculate(@Param('id', ParseUUIDPipe) id: string) {
    return this.budgetEstimateService.recalculate(id);
  }

  // ============================================================
  // LOCK
  // ============================================================

  @Post(':id/lock')
  lock(@Param('id', ParseUUIDPipe) id: string) {
    return this.budgetEstimateService.lock(id);
  }

  // ============================================================
  // UNLOCK
  // ============================================================

  @Post(':id/unlock')
  unlock(@Param('id', ParseUUIDPipe) id: string) {
    return this.budgetEstimateService.unlock(id);
  }

  // ============================================================
  // DELETE
  // ============================================================

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.budgetEstimateService.remove(id);
  }
}
