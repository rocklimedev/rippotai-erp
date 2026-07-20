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
} from '@nestjs/common';

import { LeadsService } from './leads.service';
import { LeadActivityService } from './lead-activity.service';

import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { MoveStageDto } from './dto/move-stage.dto';
import { AddNoteDto } from './dto/add-note.dto';
import { ProposalDto } from './dto/proposal.dto';
import { QueryLeadsDto } from './dto/query-leads.dto';
import { UpdateDocDto } from './dto/update-doc.dto';
import { DocType } from '@/common/enums/leads.enums';

@Controller('leads')
export class LeadsController {
  constructor(
    private readonly leadsService: LeadsService,
    private readonly leadActivityService: LeadActivityService,
  ) {}

  /*
  |--------------------------------------------------------------------------
  | LEADS
  |--------------------------------------------------------------------------
  */

  @Get()
  findAll(@Query() query: QueryLeadsDto) {
    return this.leadsService.findAll(query);
  }

  @Get('board')
  board() {
    return this.leadsService.board();
  }

  @Get('review')
  review(@Query('stuckDays') stuckDays?: string) {
    return this.leadsService.review(stuckDays ? Number(stuckDays) : undefined);
  }

  /*
  |--------------------------------------------------------------------------
  | ACTIVITY
  |--------------------------------------------------------------------------
  */

  /**
   * GET ALL ACTIVITIES
   *
   * /leads/activity
   *
   * ?leadId=
   * ?date_from=
   * ?date_to=
   */
  @Get('activity')
  findActivities(@Query() query: any) {
    return this.leadActivityService.findAll(query);
  }

  /**
   * GET LEAD ACTIVITIES
   *
   * /leads/activity/lead/:leadId
   */
  @Get('activity/lead/:leadId')
  findLeadActivity(@Param('leadId') leadId: string) {
    return this.leadActivityService.findByLead(leadId);
  }

  /**
   * DELETE ACTIVITY
   *
   * /leads/activity/:id
   */
  @Delete('activity/:id')
  removeActivity(@Param('id') id: string) {
    return this.leadActivityService.remove(id);
  }

  /*
  |--------------------------------------------------------------------------
  | SINGLE LEAD
  |--------------------------------------------------------------------------
  */

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.leadsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateLeadDto) {
    return this.leadsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateLeadDto) {
    return this.leadsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.leadsService.remove(id);
  }

  @Patch(':id/stage')
  moveStage(@Param('id', ParseUUIDPipe) id: string, @Body() dto: MoveStageDto) {
    return this.leadsService.moveStage(id, dto);
  }

  @Patch(':id/nurture')
  markNurture(@Param('id', ParseUUIDPipe) id: string) {
    return this.leadsService.markNurture(id);
  }

  @Patch(':id/lost')
  markLost(@Param('id', ParseUUIDPipe) id: string) {
    return this.leadsService.markLost(id);
  }

  @Post(':id/notes')
  addNote(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AddNoteDto) {
    return this.leadsService.addNote(id, dto);
  }

  @Post(':id/proposal')
  setProposal(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ProposalDto,
  ) {
    return this.leadsService.setProposal(id, dto);
  }

  @Patch(':id/docs/:docType')
  updateDoc(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('docType') docType: DocType,
    @Body() dto: UpdateDocDto,
  ) {
    return this.leadsService.updateDoc(id, docType, dto);
  }

  @Patch(':id/color')
  updateColor(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('color') color: string | null,
  ) {
    return this.leadsService.updateColor(id, color);
  }

  @Patch(':id/follow-up')
  updateFollowUp(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('followUp') followUp: string | null,
  ) {
    return this.leadsService.updateFollowUp(id, followUp);
  }
}
