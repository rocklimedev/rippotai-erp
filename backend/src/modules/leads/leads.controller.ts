import { RequirePermission } from '@/common/decorator/require-permission.decorator';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { LeadsService } from './leads.service';
import type { LeadFilters } from './leads.service';

import { JwtAuthGuard } from '@/common/guards/jwt-auth-guard';
import type { RequestWithUser } from '@/common/interfaces/request-with-user-interfaces';

const actorOf = (req: RequestWithUser) => ({ id: req.user.id, name: req.user.name });

/**
 * CRM pipeline (deals). Runs on INOS's own `leads` table; Zoho Bigin is an
 * optional mirror (see LeadsService).
 */
@Controller('leads')
@UseGuards(JwtAuthGuard)
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  // GET /api/v1/leads/board?q=&owner=&source=&minValue=&maxValue=&from=&to=&sort=
  @RequirePermission('leads:read')
  @Get('board')
  getBoard(@Req() req: RequestWithUser, @Query() filters: LeadFilters) {
    return this.leadsService.getBoard(req.user.id, filters);
  }

  // GET /api/v1/leads/meta — stages, owners, sources, zoho status
  @RequirePermission('leads:read')
  @Get('meta')
  getMeta(@Req() req: RequestWithUser) {
    return this.leadsService.getMeta(req.user.id);
  }

  // GET /api/v1/leads/activity — global activity feed
  @RequirePermission('leads:read')
  @Get('activity')
  getActivity(
    @Query('leadId') leadId?: string,
    @Query('user') user?: string,
    @Query('date_from') date_from?: string,
    @Query('date_to') date_to?: string,
  ) {
    return this.leadsService.getActivity({ leadId, user, date_from, date_to });
  }

  // GET /api/v1/leads/review?days=7 — KPI / widget data
  @RequirePermission('leads:read')
  @Get('review')
  getReview(@Query('days') days?: string) {
    return this.leadsService.getReview(Number(days) || 7);
  }

  // POST /api/v1/leads/sync/zoho — import deals from Bigin (when connected)
  @RequirePermission('leads:sync')
  @Post('sync/zoho')
  syncZoho(@Req() req: RequestWithUser) {
    return this.leadsService.syncFromZoho(actorOf(req));
  }

  // POST /api/v1/leads
  @RequirePermission('leads:create')
  @Post()
  createLead(@Req() req: RequestWithUser, @Body() body: Record<string, any>) {
    return this.leadsService.createLead(actorOf(req), body);
  }

  // GET /api/v1/leads?q=&stage=&owner=&source=&sort=
  @RequirePermission('leads:read')
  @Get()
  getLeads(@Query() filters: LeadFilters) {
    return this.leadsService.getLeads(filters);
  }

  // GET /api/v1/leads/:id — full deal (notes, timeline, tasks, documents)
  @RequirePermission('leads:read')
  @Get(':id')
  getLead(@Param('id') id: string) {
    return this.leadsService.getLead(id);
  }

  // DELETE /api/v1/leads/:id
  @RequirePermission('leads:delete')
  @Delete(':id')
  deleteLead(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.leadsService.deleteLead(actorOf(req), id);
  }

  // PUT /api/v1/leads/:id/stage { stage, lostReason? }
  @RequirePermission('leads:update')
  @Put(':id/stage')
  moveStage(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body('stage') stage: string,
    @Body('lostReason') lostReason?: string,
  ) {
    return this.leadsService.moveStage(actorOf(req), id, stage, { lostReason });
  }

  // PUT|PATCH /api/v1/leads/:id
  @RequirePermission('leads:update')
  @Put(':id')
  updateLead(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() body: Record<string, any>,
  ) {
    return this.leadsService.updateLead(actorOf(req), id, body);
  }

  @RequirePermission('leads:update')
  @Patch(':id')
  patchLead(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() body: Record<string, any>,
  ) {
    return this.leadsService.updateLead(actorOf(req), id, body);
  }

  // POST /api/v1/leads/:id/notes
  @RequirePermission('leads:create')
  @Post(':id/notes')
  addNote(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body('text') text: string,
  ) {
    return this.leadsService.addNote(actorOf(req), id, text);
  }

  @RequirePermission('leads:delete')
  @Delete(':id/notes/:noteId')
  deleteNote(@Param('id') id: string, @Param('noteId') noteId: string) {
    return this.leadsService.deleteNote(id, noteId);
  }

  // Tasks
  @RequirePermission('leads:create')
  @Post(':id/tasks')
  addTask(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() body: { title: string; dueDate?: string },
  ) {
    return this.leadsService.addTask(actorOf(req), id, body);
  }

  @RequirePermission('leads:update')
  @Put(':id/tasks/:taskId')
  updateTask(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Param('taskId') taskId: string,
    @Body() body: Record<string, any>,
  ) {
    return this.leadsService.updateTask(actorOf(req), id, taskId, body);
  }

  @RequirePermission('leads:delete')
  @Delete(':id/tasks/:taskId')
  deleteTask(@Param('id') id: string, @Param('taskId') taskId: string) {
    return this.leadsService.deleteTask(id, taskId);
  }

  // PUT /api/v1/leads/:id/proposal
  @RequirePermission('leads:update')
  @Put(':id/proposal')
  setProposal(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body()
    body: {
      amount: string;
      timeline: string;
      remarks?: string;
    },
  ) {
    return this.leadsService.setProposal(actorOf(req), id, body);
  }
}
