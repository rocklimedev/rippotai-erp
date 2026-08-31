import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';

import { CurrentUser } from '@/common/decorator/current-user.decorator';
import { User } from '@/modules/users/models/user.model';

import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { MoveStageDto } from './dto/move-stage.dto';
import { AddNoteDto } from './dto/add-note.dto';
import { ProposalDto } from './dto/proposal.dto';
import { QueryLeadsDto } from './dto/query-leads.dto';
import { UpdateDocDto } from './dto/update-doc.dto';

@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  // =========================
  // CREATE LEAD
  // =========================

  @Post()
  async create(@Body() dto: CreateLeadDto, @CurrentUser() user: User) {
    return this.leadsService.create(dto, user);
  }

  // =========================
  // GET ALL / FILTERED
  // =========================

  @Get()
  async findAll(@Query() query: QueryLeadsDto) {
    return this.leadsService.findAll(query);
  }

  // =========================
  // KANBAN BOARD
  // =========================

  @Get('board')
  async board() {
    return this.leadsService.board();
  }

  // =========================
  // REVIEW
  // IMPORTANT: keep this BEFORE :id
  // =========================

  @Get('review')
  async review(@Query('stuckDays') stuckDays?: string) {
    return this.leadsService.review(stuckDays ? Number(stuckDays) : undefined);
  }

  // =========================
  // GET ONE
  // =========================

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.leadsService.findOne(id);
  }

  // =========================
  // UPDATE LEAD
  // =========================

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateLeadDto,
    @CurrentUser() user: User,
  ) {
    return this.leadsService.update(id, dto, user);
  }

  // =========================
  // MOVE STAGE
  // =========================

  @Patch(':id/stage')
  async moveStage(
    @Param('id') id: string,
    @Body() dto: MoveStageDto,
    @CurrentUser() user: User,
  ) {
    return this.leadsService.moveStage(id, dto, user);
  }

  // =========================
  // QUICK STAGE ACTIONS
  // =========================

  @Patch(':id/nurture')
  async markNurture(@Param('id') id: string, @CurrentUser() user: User) {
    return this.leadsService.markNurture(id, user);
  }

  @Patch(':id/lost')
  async markLost(@Param('id') id: string, @CurrentUser() user: User) {
    return this.leadsService.markLost(id, user);
  }

  // =========================
  // ADD NOTE
  // =========================

  @Post(':id/notes')
  async addNote(
    @Param('id') id: string,
    @Body() dto: AddNoteDto,
    @CurrentUser() user: User,
  ) {
    return this.leadsService.addNote(id, dto, user);
  }

  // =========================
  // SET PROPOSAL
  // =========================

  @Patch(':id/proposal')
  async setProposal(
    @Param('id') id: string,
    @Body() dto: ProposalDto,
    @CurrentUser() user: User,
  ) {
    return this.leadsService.setProposal(id, dto, user);
  }

  // =========================
  // UPDATE DOCUMENT STATUS
  // =========================

  @Patch(':id/docs/:docType')
  async updateDoc(
    @Param('id') id: string,
    @Param('docType') docType: string,
    @Body() dto: UpdateDocDto,
  ) {
    return this.leadsService.updateDoc(id, docType as any, dto);
  }

  // =========================
  // UPDATE COLOR
  // =========================

  @Patch(':id/color')
  async updateColor(
    @Param('id') id: string,
    @Body('color') color: string | null,
  ) {
    return this.leadsService.updateColor(id, color);
  }

  // =========================
  // UPDATE FOLLOW-UP
  // =========================

  @Patch(':id/follow-up')
  async updateFollowUp(
    @Param('id') id: string,
    @Body('followUp') followUp: string | null,
  ) {
    return this.leadsService.updateFollowUp(id, followUp);
  }

  // =========================
  // DELETE LEAD
  // =========================

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.leadsService.remove(id, user);
  }
}
