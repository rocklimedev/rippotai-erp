import { RequirePermission } from '@/common/decorator/require-permission.decorator';
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ChecklistService } from './checklist.service';
import { QcSignOffService } from './qc-sign-off.service';
import {
  CreateChecklistTemplateDto,
  AddChecklistItemDto,
  RecordQcSignOffDto,
} from './dto/qc.dto';

@Controller('site-ops/checklists')
export class ChecklistController {
  constructor(private readonly checklistService: ChecklistService) {}

  @RequirePermission('site-ops-checklists:create')
  @Post('templates')
  createTemplate(@Body() dto: CreateChecklistTemplateDto) {
    return this.checklistService.createTemplate(dto);
  }

  @RequirePermission('site-ops-checklists:create')
  @Post('items')
  addItem(@Body() dto: AddChecklistItemDto) {
    return this.checklistService.addItem(dto);
  }

  @RequirePermission('site-ops-checklists:read')
  @Get('templates/:id')
  getTemplate(@Param('id', ParseIntPipe) id: number) {
    return this.checklistService.getTemplateOrThrow(id);
  }

  /** GET /site-ops/checklists/templates?tradeTeamId=3&stepId=12 */
  @RequirePermission('site-ops-checklists:read')
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
  @RequirePermission('site-ops-qc:sign-off')
  @Post()
  recordSignOff(@Body() dto: RecordQcSignOffDto) {
    return this.qcService.recordSignOff(dto);
  }

  /** GET /site-ops/qc/history?projectId=<uuid>&from=&to=&status=FAIL — all projects when projectId is omitted. */
  @RequirePermission('site-ops-qc:read')
  @Get('history')
  listHistory(
    @Query('projectId') projectId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('status') status?: string,
  ) {
    return this.qcService.history({ projectId: projectId || undefined, from, to, status });
  }

  /** GET /site-ops/qc/handoff-status?projectId=<uuid> — latest result per project/step/trade. */
  @RequirePermission('site-ops-qc:read')
  @Get('handoff-status')
  listHandoff(@Query('projectId') projectId?: string) {
    return this.qcService.getHandoffStatus(projectId || undefined);
  }

  @RequirePermission('site-ops-qc:read')
  @Get(':id')
  getSignOff(@Param('id', ParseIntPipe) id: number) {
    return this.qcService.getSignOffOrThrow(id);
  }

  @RequirePermission('site-ops-qc:read')
  @Get('projects/:projectId/history')
  getHistory(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.qcService.getProjectHistory(projectId);
  }

  /** Latest pass/fail/rework per phase+trade — whether handoff to the next trade is currently clear. */
  @RequirePermission('site-ops-qc:read')
  @Get('projects/:projectId/handoff-status')
  getHandoffStatus(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.qcService.getHandoffStatus(projectId);
  }
}
