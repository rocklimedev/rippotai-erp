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
import { AddTeamMemberDto } from '../users/dto/add-team-member.dto';
import { UpdateTeamMemberDto } from '../users/dto/update-team-member.dto';

// Mounted once, reused by every module that has a "Team" tab:
//   GET    /team/PLAN_OF_ACTION/:ownerId
//   POST   /team/PLAN_OF_ACTION/:ownerId
//   PUT    /team/PLAN_OF_ACTION/:ownerId   (replace the whole roster)
//   PATCH  /team/members/:id
//   DELETE /team/members/:id
// Swap PLAN_OF_ACTION for PROJECT, QUOTATION, BOQ, etc. — same routes,
// same table, no new controller needed.
@Controller('team')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Get(':ownerType/:ownerId')
  list(
    @Param('ownerType', new ParseEnumPipe(TeamMemberOwnerType))
    ownerType: TeamMemberOwnerType,
    @Param('ownerId', ParseUUIDPipe) ownerId: string,
  ) {
    return this.teamService.list(ownerType, ownerId);
  }

  @Post(':ownerType/:ownerId')
  add(
    @Param('ownerType', new ParseEnumPipe(TeamMemberOwnerType))
    ownerType: TeamMemberOwnerType,
    @Param('ownerId', ParseUUIDPipe) ownerId: string,
    @Body() dto: AddTeamMemberDto,
  ) {
    return this.teamService.add(ownerType, ownerId, dto);
  }

  @Put(':ownerType/:ownerId')
  replaceAll(
    @Param('ownerType', new ParseEnumPipe(TeamMemberOwnerType))
    ownerType: TeamMemberOwnerType,
    @Param('ownerId', ParseUUIDPipe) ownerId: string,
    @Body() dto: AddTeamMemberDto[],
  ) {
    return this.teamService.replaceAll(ownerType, ownerId, dto);
  }

  @Patch('members/:id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTeamMemberDto,
  ) {
    return this.teamService.update(id, dto);
  }

  @Delete('members/:id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.teamService.remove(id);
  }
}
