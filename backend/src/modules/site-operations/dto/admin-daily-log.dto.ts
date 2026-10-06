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
  MaxLength,
  Min,
  Matches,
  IsNotEmpty,
} from 'class-validator';
import { DprWorkStatus } from '@/common/enums/dpr.enums';

export class CreateAdminDailyLogDto {
  /** Defaults to today on the server if omitted */
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) @IsDateString({ strict: true }) log_date?: string;
  @IsString() @IsNotEmpty() @MaxLength(150) work_type: string;
  @IsOptional() @IsUUID() project_id?: string;
  @IsString() @IsNotEmpty() details: string;
  @IsOptional() @IsEnum(DprWorkStatus) status?: DprWorkStatus;
  @IsOptional() @IsString() @MaxLength(255) pending_with?: string;
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) @IsDateString({ strict: true }) due_date?: string;
  @IsOptional() @IsString() remarks?: string;
}

export class UpdateAdminDailyLogDto extends PartialType(
  CreateAdminDailyLogDto,
) {}

export class QueryAdminDailyLogDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(200) limit?: number =
    20;
  @IsOptional() @IsUUID() project_id?: string;
  @IsOptional() @IsEnum(DprWorkStatus) status?: DprWorkStatus;
  @IsOptional() @IsString() work_type?: string;
  @IsOptional() @IsString() pending_with?: string;
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) @IsDateString({ strict: true }) from_date?: string;
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) @IsDateString({ strict: true }) to_date?: string;
  /** Not completed and due_date < today */
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  overdue?: boolean;
  @IsOptional() @IsString() @MaxLength(100) search?: string;
}
