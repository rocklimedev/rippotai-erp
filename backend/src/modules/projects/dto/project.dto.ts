import { PartialType, OmitType } from '@nestjs/mapped-types';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { ProjectPriority, ProjectStatus } from '../../../common/enums';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  slug: string;

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

  // NOTE: created_by, updated_by, archived_by, deleted_by are intentionally
  // absent. These are derived from the authenticated user in the service
  // layer (@CurrentUser()) and must never be accepted from the request body,
  // or a client could forge audit trail data.

  // NOTE: approved_value / quotation_count are intentionally absent. Both
  // are live-computed aggregates over the quotations table (see
  // ProjectsService.findAll/findOne) and are not user-settable.
}

// updated_by, created_by etc. still excluded — nothing to OmitType here
// since CreateProjectDto never had them in the first place, but keeping
// this pattern documents the intent and makes future additions safer.
export class UpdateProjectDto extends PartialType(
  OmitType(CreateProjectDto, [] as const),
) {}
