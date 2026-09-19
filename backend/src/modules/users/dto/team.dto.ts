import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

import { TeamAccessLevel } from '@/common/enums/team.enums';

// ============================================================
// TEAM
// ============================================================

export class CreateTeamDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE'])
  status?: 'ACTIVE' | 'INACTIVE';

  @IsOptional()
  @IsUUID()
  created_by?: string | null;
}

export class UpdateTeamDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE'])
  status?: 'ACTIVE' | 'INACTIVE';
}

// ============================================================
// TEAM MEMBER
// ============================================================

export class AddTeamMemberDto {
  @IsUUID()
  user_id: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  role_label: string;

  @IsOptional()
  @IsBoolean()
  is_primary?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  sort_order?: number;
}

export class UpdateTeamMemberDto {
  @IsOptional()
  @IsUUID()
  user_id?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  role_label?: string;

  @IsOptional()
  @IsBoolean()
  is_primary?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  sort_order?: number;
}

// ============================================================
// TEAM SECTION
// ============================================================

export class CreateTeamSectionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  key: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  parent_key?: string | null;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE'])
  status?: 'ACTIVE' | 'INACTIVE';

  @IsOptional()
  @IsInt()
  @Min(0)
  sort_order?: number;
}

export class UpdateTeamSectionDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  key?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  parent_key?: string | null;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE'])
  status?: 'ACTIVE' | 'INACTIVE';

  @IsOptional()
  @IsInt()
  @Min(0)
  sort_order?: number;
}

// ============================================================
// SECTION ACCESS
// ============================================================

export class SetTeamSectionAccessDto {
  @IsUUID()
  section_id: string;

  @IsEnum(TeamAccessLevel)
  access_level: TeamAccessLevel;

  @IsOptional()
  @IsBoolean()
  can_view?: boolean;

  @IsOptional()
  @IsBoolean()
  can_create?: boolean;

  @IsOptional()
  @IsBoolean()
  can_edit?: boolean;

  @IsOptional()
  @IsBoolean()
  can_delete?: boolean;

  @IsOptional()
  @IsBoolean()
  can_approve?: boolean;

  @IsOptional()
  @IsObject()
  scope?: Record<string, any> | null;
}
// ============================================================
// BULK ACCESS
// ============================================================

export class BulkTeamSectionAccessDto {
  access: SetTeamSectionAccessDto[];
}
