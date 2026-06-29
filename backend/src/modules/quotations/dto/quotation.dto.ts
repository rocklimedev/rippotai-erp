import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  IsInt,
  ValidateNested,
} from 'class-validator';
import { IsEnum } from 'class-validator';

export enum GlobalDiscountType {
  FIXED = 'fixed',
  PERCENTAGE = 'percentage',
}
export class CreateQuotationItemDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  sno?: number;

  @IsString()
  @IsNotEmpty()
  particular: string;

  @IsNumber()
  @Min(0)
  rate: number;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class CreateQuotationDto {
  @IsUUID()
  @IsNotEmpty()
  project_id: string;

  @IsUUID()
  @IsNotEmpty()
  vendor_id: string;

  @IsDateString()
  quotation_date: string;

  @IsOptional()
  @IsString()
  quotation_number?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateQuotationItemDto)
  items: CreateQuotationItemDto[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  additional_charges?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;
  @IsOptional()
  @IsEnum(GlobalDiscountType)
  global_discount_type?: GlobalDiscountType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  global_discount_value?: number;
  @IsOptional()
  @IsNumber()
  @Min(0)
  tax_percent?: number;

  @IsOptional()
  @IsString()
  terms_conditions?: string;

  @IsOptional()
  @IsUUID()
  created_by?: string;
}

export class UpdateQuotationDto {
  @IsOptional()
  @IsDateString()
  quotation_date?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuotationItemDto)
  items?: CreateQuotationItemDto[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  additional_charges?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;
  @IsOptional()
  @IsEnum(GlobalDiscountType)
  global_discount_type?: GlobalDiscountType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  global_discount_value?: number;
  @IsOptional()
  @IsNumber()
  @Min(0)
  tax_percent?: number;

  @IsOptional()
  @IsString()
  terms_conditions?: string;

  @IsOptional()
  @IsUUID()
  updated_by?: string;
}

export class ReviewQuotationDto {
  @IsOptional()
  @IsUUID()
  reviewed_by?: string;

  @IsOptional()
  @IsString()
  review_remarks?: string;
}
