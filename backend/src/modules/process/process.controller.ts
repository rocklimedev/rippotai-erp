// process.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ProcessService } from './process.service';

import { CreateProcessPhaseDto } from './dto/create-project-phase.dto';
import { UpdateProcessPhaseDto } from './dto/update-project-phase.dto';
import { CreateProcessStepDto } from './dto/create-process-step.dto';
import { UpdateProcessStepDto } from './dto/update-process-step.dto';
import { CreateDeliverableTypeDto } from './dto/create-deliverable-type.dto';
import { UpdateProjectStepProgressDto } from './dto/update-project-step-progress.dto';
import { CreateProjectGateLogDto } from './dto/create-project-gate-log.dto';
import { BulkStepProgressUpdate } from './dto/bulk-step-progress-update.dto';
@Controller('process')
export class ProcessController {
  constructor(private readonly processService: ProcessService) {}

  // ============================================================
  // 1. PROCESS PHASES
  // ============================================================

  @Post('phases')
  createPhase(@Body() dto: CreateProcessPhaseDto) {
    return this.processService.createPhase(dto);
  }

  @Get('phases')
  findAllPhases(@Query('includeSteps') includeSteps?: string) {
    return this.processService.findAllPhases(includeSteps !== 'false');
  }

  @Get('phases/:id')
  findPhase(@Param('id') id: string) {
    return this.processService.findPhaseById(id);
  }

  @Get('phases/by-no/:phaseNo')
  findPhaseByNo(@Param('phaseNo') phaseNo: string) {
    return this.processService.findPhaseByNo(phaseNo);
  }

  @Patch('phases/:id')
  updatePhase(@Param('id') id: string, @Body() dto: UpdateProcessPhaseDto) {
    return this.processService.updatePhase(id, dto);
  }

  @Delete('phases/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deletePhase(@Param('id') id: string) {
    return this.processService.deletePhase(id);
  }

  @Put('phases/reorder')
  reorderPhases(@Body('orderedIds') orderedIds: string[]) {
    return this.processService.reorderPhases(orderedIds);
  }

  // ============================================================
  // 2. PROCESS STEPS
  // ============================================================

  @Post('steps')
  createStep(@Body() dto: CreateProcessStepDto) {
    return this.processService.createStep(dto);
  }

  @Get('phases/:phaseId/steps')
  findStepsByPhase(@Param('phaseId') phaseId: string) {
    return this.processService.findStepsByPhase(phaseId);
  }

  @Get('steps/:id')
  findStep(@Param('id') id: string) {
    return this.processService.findStepById(id);
  }

  @Patch('steps/:id')
  updateStep(@Param('id') id: string, @Body() dto: UpdateProcessStepDto) {
    return this.processService.updateStep(id, dto);
  }

  @Delete('steps/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteStep(@Param('id') id: string) {
    return this.processService.deleteStep(id);
  }

  @Put('phases/:phaseId/steps/reorder')
  reorderSteps(
    @Param('phaseId') phaseId: string,
    @Body('orderedIds') orderedIds: string[],
  ) {
    return this.processService.reorderSteps(phaseId, orderedIds);
  }

  /** Assign teams to a step */
  @Put('steps/:id/teams')
  setStepTeams(@Param('id') id: string, @Body('teamIds') teamIds: string[]) {
    return this.processService.setStepTeams(id, teamIds);
  }

  /** Assign deliverable types to a step */
  @Put('steps/:id/deliverables')
  setStepDeliverables(
    @Param('id') id: string,
    @Body('deliverableTypeIds') deliverableTypeIds: string[],
  ) {
    return this.processService.setStepDeliverables(id, deliverableTypeIds);
  }

  // ============================================================
  // 3. DELIVERABLE TYPES
  // ============================================================

  @Post('deliverable-types')
  createDeliverableType(@Body() dto: CreateDeliverableTypeDto) {
    return this.processService.createDeliverableType(dto);
  }

  @Get('deliverable-types')
  findAllDeliverableTypes() {
    return this.processService.findAllDeliverableTypes();
  }

  @Get('deliverable-types/:id')
  findDeliverableType(@Param('id') id: string) {
    return this.processService.findDeliverableTypeById(id);
  }

  @Patch('deliverable-types/:id')
  updateDeliverableType(@Param('id') id: string, @Body('name') name: string) {
    return this.processService.updateDeliverableType(id, name);
  }

  @Delete('deliverable-types/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteDeliverableType(@Param('id') id: string) {
    return this.processService.deleteDeliverableType(id);
  }

  // ============================================================
  // 4. PROJECT PHASE PROGRESS
  // ============================================================

  @Get('projects/:projectId/phases/progress')
  getAllPhaseProgress(@Param('projectId') projectId: string) {
    return this.processService.getAllPhaseProgress(projectId);
  }

  @Get('projects/:projectId/phases/:phaseId/progress')
  getPhaseProgress(
    @Param('projectId') projectId: string,
    @Param('phaseId') phaseId: string,
  ) {
    return this.processService.getPhaseProgress(projectId, phaseId);
  }

  @Patch('projects/:projectId/phases/:phaseId/progress')
  updatePhaseProgress(
    @Param('projectId') projectId: string,
    @Param('phaseId') phaseId: string,
    @Body('status')
    status: 'not_started' | 'in_progress' | 'completed' | 'skipped',
  ) {
    return this.processService.updatePhaseProgress(projectId, phaseId, status);
  }

  // ============================================================
  // 5. PROJECT STEP PROGRESS (Trade-level + Work Packages)
  // ============================================================

  @Get('projects/:projectId/steps/:stepId/progress')
  getStepProgress(
    @Param('projectId') projectId: string,
    @Param('stepId') stepId: string,
  ) {
    return this.processService.getStepProgress(projectId, stepId);
  }

  @Get('projects/:projectId/phases/:phaseId/steps/progress')
  getStepsProgressByPhase(
    @Param('projectId') projectId: string,
    @Param('phaseId') phaseId: string,
  ) {
    return this.processService.getStepsProgressByPhase(projectId, phaseId);
  }

  @Patch('projects/:projectId/steps/:stepId/progress')
  updateStepProgress(
    @Param('projectId') projectId: string,
    @Param('stepId') stepId: string,
    @Body() dto: UpdateProjectStepProgressDto,
  ) {
    return this.processService.updateStepProgress(projectId, stepId, dto);
  }

  @Patch('projects/:projectId/steps/progress/bulk')
  bulkUpdateStepProgress(
    @Param('projectId') projectId: string,
    @Body('updates') updates: BulkStepProgressUpdate[],
  ) {
    return this.processService.bulkUpdateStepProgress(projectId, updates);
  }
  /** Work-package view for a specific trade/team */
  @Get('projects/:projectId/teams/:teamId/work-packages')
  getWorkPackagesByTeam(
    @Param('projectId') projectId: string,
    @Param('teamId') teamId: string,
  ) {
    return this.processService.getWorkPackagesByTeam(projectId, teamId);
  }

  /** Trade-level progress (Execution Tracking style) */
  @Get('projects/:projectId/teams/:teamId/trade-progress')
  getTradeLevelProgress(
    @Param('projectId') projectId: string,
    @Param('teamId') teamId: string,
  ) {
    return this.processService.getTradeLevelProgress(projectId, teamId);
  }

  // ============================================================
  // 6. QUALITY GATES
  // ============================================================

  @Post('gate-logs')
  logGateCrossing(@Body() dto: CreateProjectGateLogDto) {
    return this.processService.logGateCrossing(dto);
  }

  @Get('projects/:projectId/gate-logs')
  getGateHistory(
    @Param('projectId') projectId: string,
    @Query('stepId') stepId?: string,
  ) {
    return this.processService.getGateHistory(projectId, stepId);
  }

  // ============================================================
  // 7. DASHBOARD / SUMMARY
  // ============================================================

  @Get('projects/:projectId/summary')
  getProjectProgressSummary(@Param('projectId') projectId: string) {
    return this.processService.getProjectProgressSummary(projectId);
  }
}
