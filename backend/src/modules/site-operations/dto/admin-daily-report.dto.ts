import { PartialType } from '@nestjs/mapped-types';
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
  MaxLength,
  Matches,
} from 'class-validator';
import { DprWorkStatus } from '@/common/enums/dpr.enums';

export class CreateAdminDailyReportDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/) @IsDateString({ strict: true }) report_date: string;
  @IsUUID() project_id: string;
  @IsOptional() @IsEnum(DprWorkStatus) work_status?: DprWorkStatus;
  @IsOptional() @IsString() work_details?: string;
  @IsOptional() @IsString() contractor_working?: string;
  @IsOptional() @IsString() work_planned_tomorrow?: string;
  @IsOptional() @IsString() material_required_tomorrow?: string;
  @IsOptional() @IsString() material_sent_from_vendor?: string;
  @IsOptional() @IsString() material_sent_from_inventory?: string;
  @IsOptional() @IsString() issues_blockers?: string;
  @IsOptional() @IsBoolean() photos_attached?: boolean;
}

export class UpdateAdminDailyReportDto extends PartialType(
  CreateAdminDailyReportDto,
) {}

export class QueryAdminDailyReportDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(200) limit?: number =
    20;
  @IsOptional() @IsUUID() project_id?: string;
  @IsOptional() @IsEnum(DprWorkStatus) work_status?: DprWorkStatus;
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) @IsDateString({ strict: true }) date?: string;
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) @IsDateString({ strict: true }) from_date?: string;
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) @IsDateString({ strict: true }) to_date?: string;
  /** Only rows that have an issue/blocker filled in */
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  has_blockers?: boolean;
  @IsOptional() @IsString() @MaxLength(100) search?: string;
}
