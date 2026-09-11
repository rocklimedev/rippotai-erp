import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { LeadsService } from './leads.service';

import { JwtAuthGuard } from '@/common/guards/jwt-auth-guard';
import type { RequestWithUser } from '@/common/interfaces/request-with-user-interfaces';

@Controller('leads')
@UseGuards(JwtAuthGuard)
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  // GET /api/v1/leads/board
  @Get('board')
  getBoard(@Req() req: RequestWithUser) {
    return this.leadsService.getBoard(req.user.id);
  }

  // POST /api/v1/leads
  @Post()
  createLead(@Req() req: RequestWithUser, @Body() body: Record<string, any>) {
    return this.leadsService.createLead(req.user.id, body as any);
  }

  // GET /api/v1/leads?q=&sort=
  @Get()
  getLeads(
    @Req() req: RequestWithUser,
    @Query('q') q?: string,
    @Query('sort') sort?: string,
  ) {
    return this.leadsService.getLeads(req.user.id, { q, sort });
  }

  // DELETE /api/v1/leads/:id
  @Delete(':id')
  deleteLead(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.leadsService.deleteLead(req.user.id, id);
  }

  // PUT /api/v1/leads/:id/stage
  @Put(':id/stage')
  moveStage(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body('stage') stage: string,
  ) {
    return this.leadsService.moveStage(req.user.id, id, stage);
  }

  // PUT /api/v1/leads/:id
  @Put(':id')
  updateLead(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() body: Record<string, any>,
  ) {
    return this.leadsService.updateLead(req.user.id, id, body);
  }

  // POST /api/v1/leads/:id/notes
  @Post(':id/notes')
  addNote(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body('text') text: string,
  ) {
    return this.leadsService.addNote(req.user.id, id, text);
  }

  // PUT /api/v1/leads/:id/proposal
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
    return this.leadsService.setProposal(req.user.id, id, body);
  }
}
