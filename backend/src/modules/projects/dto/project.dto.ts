import { PartialType, OmitType } from '@nestjs/mapped-types';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsDateString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

import { ProjectPriority, ProjectStatus } from '../../../common/enums';

// ============================================
// PROJECT TEAM MEMBER
// ============================================

export class CreateProjectTeamMemberDto {
  @IsUUID()
  @IsNotEmpty()
  user_id: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  role_label: string;

  @IsOptional()
  @IsBoolean()
  is_primary?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  sort_order?: number;
}

// ============================================
// CREATE PROJECT
// ============================================

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  // `slug` is intentionally absent.
  // It is generated server-side from `name`.

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  site_location: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @IsEnum(ProjectPriority)
  priority?: ProjectPriority;

  @IsOptional()
  @IsDateString()
  expected_completion_date?: string;

  @IsOptional()
  @IsUUID()
  client_id?: string;

  @IsOptional()
  @IsUUID()
  project_type_id?: string;

  // ============================================
  // OPTIONAL PROJECT TEAM
  // ============================================

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProjectTeamMemberDto)
  team_members?: CreateProjectTeamMemberDto[];

  // NOTE:
  // created_by, updated_by, archived_by, deleted_by
  // are intentionally absent.
  //
  // approved_value / quotation_count are also
  // intentionally absent because they are computed.
}

// ============================================
// UPDATE PROJECT
// ============================================

export class UpdateProjectDto extends PartialType(
  OmitType(CreateProjectDto, ['team_members'] as const),
) {}
