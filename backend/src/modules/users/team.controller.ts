import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
} from '@nestjs/common';

import { TeamService } from './team.service';

import { TeamMemberOwnerType } from '@/common/enums/team.enums';

import { AddTeamMemberDto, UpdateTeamMemberDto } from './dto/team.dto';

import {
  CreateTeamDto,
  UpdateTeamDto,
  CreateTeamSectionDto,
  UpdateTeamSectionDto,
  SetTeamSectionAccessDto,
  BulkTeamSectionAccessDto,
} from './dto/team.dto';

@Controller('team')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  // ============================================================
  // EXISTING GENERIC / OWNER-SCOPED TEAM
  // ============================================================

  /**
   * GET /team/:ownerType/:ownerId
   *
   * Example:
   * /team/PROJECT/:projectId
   * /team/PLAN_OF_ACTION/:poaId
   */
  @Get(':ownerType/:ownerId')
  list(
    @Param('ownerType', new ParseEnumPipe(TeamMemberOwnerType))
    ownerType: TeamMemberOwnerType,

    @Param('ownerId', ParseUUIDPipe)
    ownerId: string,
  ) {
    return this.teamService.list(ownerType, ownerId);
  }

  /**
   * POST /team/:ownerType/:ownerId
   */
  @Post(':ownerType/:ownerId')
  add(
    @Param('ownerType', new ParseEnumPipe(TeamMemberOwnerType))
    ownerType: TeamMemberOwnerType,

    @Param('ownerId', ParseUUIDPipe)
    ownerId: string,

    @Body() dto: AddTeamMemberDto,
  ) {
    return this.teamService.add(ownerType, ownerId, dto);
  }

  /**
   * PUT /team/:ownerType/:ownerId
   *
   * Replace complete owner-scoped roster.
   */
  @Put(':ownerType/:ownerId')
  replaceAll(
    @Param('ownerType', new ParseEnumPipe(TeamMemberOwnerType))
    ownerType: TeamMemberOwnerType,

    @Param('ownerId', ParseUUIDPipe)
    ownerId: string,

    @Body() dto: AddTeamMemberDto[],
  ) {
    return this.teamService.replaceAll(ownerType, ownerId, dto);
  }

  /**
   * PATCH /team/members/:id
   */
  @Patch('members/:id')
  updateMember(
    @Param('id', ParseUUIDPipe)
    id: string,

    @Body() dto: UpdateTeamMemberDto,
  ) {
    return this.teamService.update(id, dto);
  }

  /**
   * DELETE /team/members/:id
   */
  @Delete('members/:id')
  removeMember(
    @Param('id', ParseUUIDPipe)
    id: string,
  ) {
    return this.teamService.remove(id);
  }

  // ============================================================
  // ADMIN TEAMS
  // ============================================================

  /**
   * GET /team/teams
   */
  @Get('teams')
  findAllTeams() {
    return this.teamService.findAllTeams();
  }

  /**
   * POST /team/teams
   */
  @Post('teams')
  createTeam(@Body() dto: CreateTeamDto) {
    return this.teamService.createTeam(dto);
  }

  /**
   * GET /team/teams/:id
   */
  @Get('teams/:id')
  getTeam(
    @Param('id', ParseUUIDPipe)
    id: string,
  ) {
    return this.teamService.getTeamById(id);
  }

  /**
   * PATCH /team/teams/:id
   */
  @Patch('teams/:id')
  updateTeam(
    @Param('id', ParseUUIDPipe)
    id: string,

    @Body() dto: UpdateTeamDto,
  ) {
    return this.teamService.updateTeam(id, dto);
  }

  /**
   * PATCH /team/teams/:id/activate
   */
  @Patch('teams/:id/activate')
  activateTeam(
    @Param('id', ParseUUIDPipe)
    id: string,
  ) {
    return this.teamService.activateTeam(id);
  }

  /**
   * PATCH /team/teams/:id/deactivate
   */
  @Patch('teams/:id/deactivate')
  deactivateTeam(
    @Param('id', ParseUUIDPipe)
    id: string,
  ) {
    return this.teamService.deactivateTeam(id);
  }

  /**
   * DELETE /team/teams/:id
   */
  @Delete('teams/:id')
  deleteTeam(
    @Param('id', ParseUUIDPipe)
    id: string,
  ) {
    return this.teamService.deleteTeam(id);
  }

  // ============================================================
  // ADMIN TEAM MEMBERS
  // ============================================================

  /**
   * GET /team/teams/:teamId/members
   */
  @Get('teams/:teamId/members')
  getTeamMembers(
    @Param('teamId', ParseUUIDPipe)
    teamId: string,
  ) {
    return this.teamService.getTeamMembers(teamId);
  }

  /**
   * POST /team/teams/:teamId/members
   */
  @Post('teams/:teamId/members')
  addTeamMember(
    @Param('teamId', ParseUUIDPipe)
    teamId: string,

    @Body() dto: AddTeamMemberDto,
  ) {
    return this.teamService.addTeamMember(teamId, dto);
  }

  /**
   * GET /team/teams/members/:memberId
   */
  @Get('teams/members/:memberId')
  getTeamMember(
    @Param('memberId', ParseUUIDPipe)
    memberId: string,
  ) {
    return this.teamService.getTeamMemberById(memberId);
  }

  /**
   * PATCH /team/teams/members/:memberId
   */
  @Patch('teams/members/:memberId')
  updateTeamMember(
    @Param('memberId', ParseUUIDPipe)
    memberId: string,

    @Body() dto: UpdateTeamMemberDto,
  ) {
    return this.teamService.updateTeamMember(memberId, dto);
  }

  /**
   * PATCH /team/teams/members/:memberId/primary
   */
  @Patch('teams/members/:memberId/primary')
  makeMemberPrimary(
    @Param('memberId', ParseUUIDPipe)
    memberId: string,
  ) {
    return this.teamService.makeMemberPrimary(memberId);
  }

  /**
   * DELETE /team/teams/members/:memberId
   */
  @Delete('teams/members/:memberId')
  removeTeamMember(
    @Param('memberId', ParseUUIDPipe)
    memberId: string,
  ) {
    return this.teamService.removeTeamMember(memberId);
  }

  // ============================================================
  // TEAM SECTIONS
  // ============================================================

  /**
   * GET /team/sections
   */
  @Get('sections')
  findAllSections() {
    return this.teamService.findAllSections();
  }

  /**
   * POST /team/sections
   */
  @Post('sections')
  createSection(@Body() dto: CreateTeamSectionDto) {
    return this.teamService.createSection(dto);
  }

  /**
   * GET /team/sections/:id
   */
  @Get('sections/:id')
  getSection(
    @Param('id', ParseUUIDPipe)
    id: string,
  ) {
    return this.teamService.getSectionById(id);
  }

  /**
   * PATCH /team/sections/:id
   */
  @Patch('sections/:id')
  updateSection(
    @Param('id', ParseUUIDPipe)
    id: string,

    @Body() dto: UpdateTeamSectionDto,
  ) {
    return this.teamService.updateSection(id, dto);
  }

  /**
   * DELETE /team/sections/:id
   */
  @Delete('sections/:id')
  deleteSection(
    @Param('id', ParseUUIDPipe)
    id: string,
  ) {
    return this.teamService.deleteSection(id);
  }

  // ============================================================
  // TEAM SECTION ACCESS
  // ============================================================

  /**
   * GET /team/teams/:teamId/access
   */
  @Get('teams/:teamId/access')
  getTeamAccessMatrix(
    @Param('teamId', ParseUUIDPipe)
    teamId: string,
  ) {
    return this.teamService.getTeamAccessMatrix(teamId);
  }

  /**
   * GET /team/teams/:teamId/section-access
   */
  @Get('teams/:teamId/section-access')
  getTeamSectionAccess(
    @Param('teamId', ParseUUIDPipe)
    teamId: string,
  ) {
    return this.teamService.getTeamSectionAccess(teamId);
  }

  /**
   * GET /team/teams/:teamId/section-access/:sectionId
   */
  @Get('teams/:teamId/section-access/:sectionId')
  getSectionAccess(
    @Param('teamId', ParseUUIDPipe)
    teamId: string,

    @Param('sectionId', ParseUUIDPipe)
    sectionId: string,
  ) {
    return this.teamService.getSectionAccess(teamId, sectionId);
  }

  /**
   * PUT /team/teams/:teamId/section-access/:sectionId
   */
  @Put('teams/:teamId/section-access/:sectionId')
  setSectionAccess(
    @Param('teamId', ParseUUIDPipe)
    teamId: string,

    @Param('sectionId', ParseUUIDPipe)
    sectionId: string,

    @Body() dto: SetTeamSectionAccessDto,
  ) {
    return this.teamService.setTeamSectionAccess(teamId, sectionId, dto);
  }

  /**
   * POST /team/teams/:teamId/section-access/bulk
   */
  @Post('teams/:teamId/section-access/bulk')
  bulkSetSectionAccess(
    @Param('teamId', ParseUUIDPipe)
    teamId: string,

    @Body() dto: BulkTeamSectionAccessDto,
  ) {
    return this.teamService.bulkSetTeamSectionAccess(teamId, dto);
  }

  /**
   * DELETE /team/teams/:teamId/section-access/:sectionId
   */
  @Delete('teams/:teamId/section-access/:sectionId')
  removeSectionAccess(
    @Param('teamId', ParseUUIDPipe)
    teamId: string,

    @Param('sectionId', ParseUUIDPipe)
    sectionId: string,
  ) {
    return this.teamService.removeTeamSectionAccess(teamId, sectionId);
  }

  // ============================================================
  // USER ACCESS
  // ============================================================

  /**
   * GET /team/users/:userId
   */
  @Get('users/:userId')
  getUserTeams(
    @Param('userId', ParseUUIDPipe)
    userId: string,
  ) {
    return this.teamService.getUserTeams(userId);
  }

  /**
   * GET /team/users/:userId/sections/:sectionId/access
   */
  @Get('users/:userId/sections/:sectionId/access')
  getUserSectionAccess(
    @Param('userId', ParseUUIDPipe)
    userId: string,

    @Param('sectionId', ParseUUIDPipe)
    sectionId: string,
  ) {
    return this.teamService.getUserSectionAccess(userId, sectionId);
  }
}
