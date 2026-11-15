import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import {
  ProcurementQuotationStatus,
  QuotationVendorKind,
} from '../models/procurement-quotation.model';

export class QuotationItemDto {
  @IsOptional() @IsString() @MaxLength(255) category_name?: string;
  @IsString() @MinLength(1) @MaxLength(500) item_name: string;
  @IsOptional() @IsString() @MaxLength(5000) description?: string;
  @IsOptional() @IsString() @MaxLength(30) unit?: string;
  @IsNumber() @Min(0) quantity: number;
  @IsNumber() @Min(0) rate: number;
  @IsOptional() @IsNumber() @Min(0) @Max(100) tax_percent?: number;
  @IsOptional() @IsString() @MaxLength(2000) remarks?: string;
  @IsOptional() @IsString() @MaxLength(100) source_item_id?: string;
  @IsOptional() @IsUUID() material_id?: string;
}

export class QuotationPaymentStageDto {
  @IsString() @MaxLength(255) stage: string;
  @IsOptional() @IsDateString() date?: string;
  @IsOptional() @IsNumber() @Min(0) amount?: number;
  @IsOptional() @IsString() @MaxLength(1000) remarks?: string;
}

/** Edit a quotation. Saving creates the next version. */
export class SaveProcurementQuotationDto {
  @IsOptional() @IsEnum(QuotationVendorKind) vendor_kind?: QuotationVendorKind;
  @IsOptional() @IsDateString() quotation_date?: string;
  @IsOptional() @IsDateString() valid_until?: string | null;
  @IsOptional() @IsString() @MaxLength(255) vendor_name?: string;
  @IsOptional() @IsString() @MaxLength(255) vendor_type?: string;
  @IsOptional() @IsString() @MaxLength(50) vendor_phone?: string;
  @IsOptional() @IsString() @MaxLength(2000) vendor_address?: string;
  @IsOptional() @IsString() @MaxLength(255) project_name?: string;
  @IsOptional() @IsString() @MaxLength(2000) project_address?: string;
  @IsOptional() @IsString() @MaxLength(255) client_name?: string;
  @IsOptional() @IsString() @MaxLength(10000) terms?: string;
  @IsOptional() @IsString() @MaxLength(10000) notes?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => QuotationPaymentStageDto)
  payment_terms?: QuotationPaymentStageDto[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => QuotationItemDto)
  items?: QuotationItemDto[];

  /** Optimistic lock: the version the editor started from. */
  @IsOptional() @IsInt() @Min(1) version?: number;
}

export class CreateProcurementQuotationDto extends SaveProcurementQuotationDto {
  @IsUUID() project_id: string;
  @IsUUID() vendor_id: string;
}

/** Comparison sheet → quotation for one finalised vendor. */
export class QuotationFromComparisonDto {
  @IsUUID() comparison_id: string;
  @IsUUID() vendor_id: string;
  @IsOptional() @IsNumber() @Min(0) @Max(100) tax_percent?: number;
}

export class QuotationStatusDto {
  @IsEnum(ProcurementQuotationStatus) status: ProcurementQuotationStatus;
}
