import { Controller, Get, Post, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ChecklistService } from './checklist.service';
import { QcSignOffService } from './qc-sign-off.service';
import { CreateChecklistTemplateDto, AddChecklistItemDto, RecordQcSignOffDto } from './dto/qc.dto';

@Controller('site-ops/checklists')
export class ChecklistController {
  constructor(private readonly checklistService: ChecklistService) {}

  @Post('templates')
  createTemplate(@Body() dto: CreateChecklistTemplateDto) {
    return this.checklistService.createTemplate(dto);
  }

  @Post('items')
  addItem(@Body() dto: AddChecklistItemDto) {
    return this.checklistService.addItem(dto);
  }

  @Get('templates/:id')
  getTemplate(@Param('id', ParseIntPipe) id: number) {
    return this.checklistService.getTemplateOrThrow(id);
  }

  /** GET /site-ops/checklists/templates?tradeTeamId=3&stepId=12 */
  @Get('templates')
  listTemplates(
    @Query('tradeTeamId') tradeTeamId?: string,
    @Query('stepId') stepId?: string,
  ) {
    return this.checklistService.listTemplates(
      tradeTeamId ? Number(tradeTeamId) : undefined,
      stepId ? Number(stepId) : undefined,
    );
  }
}

@Controller('site-ops/qc')
export class QcSignOffController {
  constructor(private readonly qcService: QcSignOffService) {}

  /** Records pass/fail/rework for a project + phase/step + trade. */
  @Post()
  recordSignOff(@Body() dto: RecordQcSignOffDto) {
    return this.qcService.recordSignOff(dto);
  }

  @Get(':id')
  getSignOff(@Param('id', ParseIntPipe) id: number) {
    return this.qcService.getSignOffOrThrow(id);
  }

  @Get('projects/:projectId/history')
  getHistory(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.qcService.getProjectHistory(projectId);
  }

  /** Latest pass/fail/rework per phase+trade — whether handoff to the next trade is currently clear. */
  @Get('projects/:projectId/handoff-status')
  getHandoffStatus(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.qcService.getHandoffStatus(projectId);
  }
}
