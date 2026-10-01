import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { QualityCheckStatus } from '@/common/enums/architect-visit.enums';

export class CreateQualityItemDto {
  @IsString() @MaxLength(255) name: string;
  @IsOptional() @Type(() => Number) @IsInt() sort_order?: number;
  @IsOptional() @IsBoolean() is_active?: boolean;
}
export class UpdateQualityItemDto extends PartialType(CreateQualityItemDto) {}

export class UpsertQualityCheckDto {
  @IsUUID() project_id: string;
  @IsUUID() item_id: string;
  @IsEnum(QualityCheckStatus) status: QualityCheckStatus;
  @IsOptional() @IsString() remarks?: string;
}

export class QueryQualityCheckDto {
  @IsUUID() project_id: string;
  @IsOptional() @IsEnum(QualityCheckStatus) status?: QualityCheckStatus;
}
