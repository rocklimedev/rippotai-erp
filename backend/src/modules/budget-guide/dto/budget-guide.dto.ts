import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class GuideItemDto {
  @IsString() @Length(1, 255) name: string;
  @IsOptional() @IsString() @MaxLength(4000) specification?: string;
  @IsString() @Length(1, 80) unit: string;
  @IsNumber({ maxDecimalPlaces: 4 }) @Min(0) @Max(100000000) quantity: number;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(100000000) rate_low: number;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(100000000) rate_high: number;
  @IsOptional() @IsString() @MaxLength(4000) notes?: string;
}
export class GuideCostHeadDto {
  @IsString() @Length(1, 255) name: string;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(100) share_percent: number;
  @IsOptional() @IsString() @MaxLength(4000) notes?: string;
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => GuideItemDto)
  items: GuideItemDto[];
}
export class GuideMaterialDto {
  @IsString() @Length(1, 255) category: string;
  @IsString() @MaxLength(1000) brand_make: string;
  @IsOptional() @IsString() @MaxLength(4000) specification?: string;
  @IsString() @Length(1, 80) unit: string;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(100000000) rate_low: number;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(100000000) rate_high: number;
  @IsBoolean() fitted: boolean;
  @IsOptional() @IsString() @MaxLength(4000) notes?: string;
}
export class GuidePlanDto {
  @IsIn(['essential', 'signature', 'bespoke']) key:
    | 'essential'
    | 'signature'
    | 'bespoke';
  @IsString() @Length(1, 100) name: string;
  @IsString() @MaxLength(4000) specification: string;
  @IsIn(['distribution', 'itemized']) costing_mode: 'distribution' | 'itemized';
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(100000000) rate_low: number;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(100000000) rate_high: number;
  @IsBoolean() upper_open: boolean;
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => GuideCostHeadDto)
  cost_heads: GuideCostHeadDto[];
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => GuideMaterialDto)
  materials: GuideMaterialDto[];
}
export class GuideNoteDto {
  @IsString() @Length(1, 255) heading: string;
  @IsString() @MaxLength(8000) text: string;
}
export class CreateBudgetGuideDto {
  @IsString() @Length(1, 255) title: string;
  @IsOptional() @IsUUID() project_id?: string | null;
  @IsString() @MaxLength(255) project_type: string;
  @IsString() @MaxLength(255) location: string;
  @IsString() @MaxLength(255) prepared_by: string;
  @IsString() @Matches(/^[A-Z]{3}$/) currency: string;
  @IsString() @Length(1, 80) area_unit: string;
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Max(100000000)
  built_up_area?: number | null;
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  issue_date: string;
  @IsInt() @Min(1) @Max(60) validity_months: number;
  @IsInt() @Min(1) @Max(365) rate_validity_days: number;
  @IsIn(['draft', 'published', 'archived']) status:
    | 'draft'
    | 'published'
    | 'archived';
  @IsString() @MaxLength(8000) introduction: string;
  @IsArray()
  @ArrayMinSize(3)
  @ArrayMaxSize(3)
  @ValidateNested({ each: true })
  @Type(() => GuidePlanDto)
  plans: GuidePlanDto[];
  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => GuideNoteDto)
  pricing_notes: GuideNoteDto[];
  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => GuideNoteDto)
  next_steps: GuideNoteDto[];
}
export class UpdateBudgetGuideDto extends PartialType(CreateBudgetGuideDto) {
  @IsInt() @Min(1) expected_revision: number;
}
export class TransferBudgetGuideDto {
  @IsUUID() project_id: string;
  @IsOptional() @IsString() @Length(1, 255) title?: string;
  @IsInt() @Min(1) expected_revision: number;
}
export class ListBudgetGuidesDto {
  @IsOptional() @IsString() @MaxLength(255) search?: string;
  @IsOptional() @IsUUID() project_id?: string;
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  generic?: boolean;
  @IsOptional() @IsIn(['draft', 'published', 'archived']) status?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit: number =
    30;
}
export class DeleteBudgetGuideDto {
  @Type(() => Number) @IsInt() @Min(1) expected_revision: number;
}
