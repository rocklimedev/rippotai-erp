import { PartialType, OmitType } from '@nestjs/mapped-types';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { VisitStatus, VisitType } from '@/common/enums/architect-visit.enums';

export class CreateSiteVisitDto {
  @IsUUID() project_id: string;
  @IsUUID() stage_id: string;
  @IsOptional() @IsEnum(VisitStatus) status?: VisitStatus;
  @IsOptional() @IsDateString() scheduled_date?: string;
  @IsOptional() @IsDateString() visited_date?: string;
  @IsOptional() @IsUUID() architect_id?: string;
  @IsOptional() @IsString() findings?: string;
  @IsOptional() @IsString() remarks?: string;
}

export class UpdateSiteVisitDto extends PartialType(
  OmitType(CreateSiteVisitDto, ['project_id', 'stage_id'] as const),
) {
  /** Set true to release a Hold Point (records who / when) */
  @IsOptional() @IsBoolean() hold_released?: boolean;
}

/** Creates all active standard visits (1-21) for a project in "Not Scheduled" state */
export class GenerateProjectVisitsDto {
  @IsUUID() project_id: string;
  @IsOptional() @IsUUID() architect_id?: string;
}

export class QuerySiteVisitDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(200) limit?: number =
    50;
  @IsOptional() @IsUUID() project_id?: string;
  @IsOptional() @IsUUID() architect_id?: string;
  @IsOptional() @IsEnum(VisitStatus) status?: VisitStatus;
  @IsOptional() @IsEnum(VisitType) visit_type?: VisitType;
  @IsOptional() @IsDateString() from_date?: string;
  @IsOptional() @IsDateString() to_date?: string;
  /** Hold-point visits that are not yet released */
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  pending_hold?: boolean;
}
