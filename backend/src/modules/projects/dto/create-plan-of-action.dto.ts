import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { UpsertPhaseDto } from './upsert-phase.dto';
import { AddTeamMemberDto } from '@/modules/users/dto/add-team-member.dto';
import { Transform } from 'class-transformer';

export class CreatePlanOfActionDto {
  @IsUUID()
  project_id: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  execution_description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  total_duration_min_days?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  total_duration_max_days?: number;

  @IsOptional()
  @IsString()
  total_duration_label?: string;

  @IsOptional()
  @Transform(({ value }) =>
    value === '' || value === null ? undefined : value,
  )
  @IsUUID()
  terms_template_id?: string;
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpsertPhaseDto)
  phases?: UpsertPhaseDto[];

  // team is set through this same payload for convenience, but is
  // actually written via TeamService — see PlanOfActionsService.create()
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddTeamMemberDto)
  team_members?: AddTeamMemberDto[];
}
