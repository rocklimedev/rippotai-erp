import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
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

  @Post('templates')
  createTemplate(@Body() dto: CreateChecklistTemplateDto) {
    return this.checklistService.createTemplate(dto);
  }

  @Post('items')
  addItem(@Body() dto: AddChecklistItemDto) {
    return this.checklistService.addItem(dto);
  }

  @Get('templates/:id')
  getTemplate(@Param('id', ParseUUIDPipe) id: string) {
    return this.checklistService.getTemplateOrThrow(id);
  }

  /** GET /site-ops/checklists/templates?tradeTeamId=3&stepId=12 */
  @Get('templates')
  listTemplates(
    @Query('tradeTeamId') tradeTeamId?: string,
    @Query('stepId') stepId?: string,
  ) {
    return this.checklistService.listTemplates(
      tradeTeamId || undefined,
      stepId || undefined,
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

  /** GET /site-ops/qc/history?projectId=<uuid>&from=&to=&status=FAIL — all projects when projectId is omitted. */
  @Get('history')
  listHistory(
    @Query('projectId') projectId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('status') status?: string,
  ) {
    return this.qcService.history({
      projectId: projectId || undefined,
      from,
      to,
      status,
    });
  }

  /** GET /site-ops/qc/handoff-status?projectId=<uuid> — latest result per project/step/trade. */
  @Get('handoff-status')
  listHandoff(@Query('projectId') projectId?: string) {
    return this.qcService.getHandoffStatus(projectId || undefined);
  }

  @Get(':id')
  getSignOff(@Param('id', ParseUUIDPipe) id: string) {
    return this.qcService.getSignOffOrThrow(id);
  }

  @Get('projects/:projectId/history')
  getHistory(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.qcService.getProjectHistory(projectId);
  }

  /** Latest pass/fail/rework per phase+trade — whether handoff to the next trade is currently clear. */
  @Get('projects/:projectId/handoff-status')
  getHandoffStatus(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.qcService.getHandoffStatus(projectId);
  }
}
