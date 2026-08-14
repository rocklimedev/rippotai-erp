import { PartialType } from '@nestjs/mapped-types';
import { AddTeamMemberDto } from './add-team-member.dto';

export class UpdateTeamMemberDto extends PartialType(AddTeamMemberDto) {}
