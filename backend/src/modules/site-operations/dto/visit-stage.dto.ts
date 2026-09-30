import { PartialType } from '@nestjs/mapped-types';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { VisitType } from '@/common/enums/architect-visit.enums';

export class CreateVisitStageDto {
  @IsInt() @Min(1) visit_no: number;
  @IsString() @MaxLength(255) stage: string;
  @IsString() checks_purpose: string;
  @IsEnum(VisitType) visit_type: VisitType;
  @IsOptional() @IsString() remarks?: string;
  @IsOptional() @IsBoolean() is_active?: boolean;
}
export class UpdateVisitStageDto extends PartialType(CreateVisitStageDto) {}
