import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/common/guards/jwt-auth-guard';
import { CurrentUser } from '@/common/decorator/current-user.decorator';
import { AutomationService } from './automation.service';

@Controller('automation')
@UseGuards(JwtAuthGuard)
export class AutomationController {
  constructor(private readonly svc: AutomationService) {}

  @Get('overview')
  overview() {
    return this.svc.overview();
  }

  @Get('catalog')
  catalog() {
    return this.svc.catalog();
  }

  @Post('run')
  runAll(@CurrentUser() user: any) {
    return this.svc.runAll(user);
  }

  @Get('rules')
  rules() {
    return this.svc.listRules();
  }

  @Post('rules/test')
  testDraft(@Body() dto: any) {
    return this.svc.testDraft(dto);
  }

  @Get('rules/:id')
  rule(@Param('id') id: string) {
    return this.svc.getRule(id);
  }

  @Post('rules')
  create(@Body() dto: any, @CurrentUser() user: any) {
    return this.svc.createRule(dto, user);
  }

  @Patch('rules/:id')
  update(@Param('id') id: string, @Body() dto: any, @CurrentUser() user: any) {
    return this.svc.updateRule(id, dto, user);
  }

  @Delete('rules/:id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.svc.deleteRule(id, user);
  }

  @Post('rules/:id/toggle')
  toggle(@Param('id') id: string, @CurrentUser() user: any) {
    return this.svc.toggleRule(id, user);
  }

  @Post('rules/:id/duplicate')
  duplicate(@Param('id') id: string, @CurrentUser() user: any) {
    return this.svc.duplicateRule(id, user);
  }

  /** Run now (body { dryRun: true } = test: evaluate without side effects). */
  @Post('rules/:id/run')
  run(@Param('id') id: string, @Body() body: { dryRun?: boolean }, @CurrentUser() user: any) {
    return this.svc.runRule(id, user, !!body?.dryRun);
  }

  @Get('runs')
  runs(@Query() q: any) {
    return this.svc.listRuns(q);
  }

  @Get('runs/:id')
  runById(@Param('id') id: string) {
    return this.svc.getRun(id);
  }

  @Get('escalations')
  escalations(@Query('status') status?: string) {
    return this.svc.listEscalations(status);
  }

  @Patch('escalations/:id')
  updateEscalation(@Param('id') id: string, @Body() dto: any, @CurrentUser() user: any) {
    return this.svc.updateEscalation(id, dto, user);
  }

  @Get('audit')
  audit(@Query('limit') limit?: string) {
    return this.svc.listAudit(Number(limit) || 200);
  }
}
