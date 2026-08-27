import {
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';

export class CreateBudgetEstimateItemDto {
  @IsOptional()
  @IsUUID()
  library_item_id?: string;

  @IsOptional()
  @IsUUID()
  boq_item_id?: string;

  @IsUUID()
  estimate_category_id: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsUUID()
  unit_id?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsNumber()
  @Min(0)
  rate: number;

  @IsOptional()
  @IsString()
  calc_type?: 'M' | 'L';

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  detail?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  hidden?: boolean;

  @IsOptional()
  sort_order?: number;
}

export class CreateBudgetEstimateCategoryDto {
  @IsOptional()
  @IsUUID()
  library_category_id?: string;

  @IsString()
  name: string;

  @IsOptional()
  sort_order?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBudgetEstimateItemDto)
  items?: CreateBudgetEstimateItemDto[];
}

export class CreateBudgetEstimateMiscellaneousDto {
  @IsString()
  name: string;

  @IsNumber()
  @Min(0)
  value: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  sort_order?: number;
}

export class CreateBudgetEstimateDto {
  @IsUUID()
  project_id: string;

  @IsOptional()
  @IsUUID()
  boq_id?: string;

  @IsOptional()
  @IsUUID()
  source_template_id?: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  estimate_number?: string;

  @IsOptional()
  @IsString()
  client_name?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  prepared_by?: string;

  @IsOptional()
  @IsDateString()
  estimate_date?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  misc_percentage?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  design_amount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  execution_amount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  supervisor_amount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  additional_amount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  tax_percentage?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount_amount?: number;

  @IsOptional()
  @IsString()
  terms_html?: string;

  @IsOptional()
  @IsUUID()
  terms_template_id?: string;

  @IsOptional()
  @IsNumber()
  terms_template_version?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBudgetEstimateCategoryDto)
  categories?: CreateBudgetEstimateCategoryDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBudgetEstimateMiscellaneousDto)
  miscellaneous?: CreateBudgetEstimateMiscellaneousDto[];
}
