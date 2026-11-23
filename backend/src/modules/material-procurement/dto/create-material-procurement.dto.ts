import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';

import { MaterialProcurementStatus } from '../models/material-procurement.model';

// ============================================================
// SHEET (material type tab)
// ============================================================

export class MaterialProcurementSheetDto {
  @IsString()
  @MaxLength(120)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  type?: string;
}

// ============================================================
// MATERIAL PROCUREMENT ITEM
// ============================================================

export class CreateMaterialProcurementItemDto {
  // ----------------------------------------------------------
  // SERIAL NUMBER
  // ----------------------------------------------------------

  @IsNumber()
  @Min(1)
  serialNo: number;

  // ----------------------------------------------------------
  // MATERIAL MASTER
  // ----------------------------------------------------------

  @IsUUID()
  materialId: string;

  // ----------------------------------------------------------
  // LOCATION / AREA
  // ----------------------------------------------------------

  @IsOptional()
  @IsString()
  area?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  sheetName?: string;

  // ----------------------------------------------------------
  // MEASUREMENTS
  // ----------------------------------------------------------

  @IsOptional()
  @IsNumber()
  @Min(0)
  wallArea?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  floorArea?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  ceilingArea?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  totalArea?: number;

  // ----------------------------------------------------------
  // QUANTITY
  // ----------------------------------------------------------

  @IsNumber()
  @Min(0)
  quantity: number;

  // ----------------------------------------------------------
  // PRICE
  // ----------------------------------------------------------

  @IsNumber()
  @Min(0)
  price: number;

  // ----------------------------------------------------------
  // AMOUNT
  // ----------------------------------------------------------

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;
}

// ============================================================
// MATERIAL PROCUREMENT
// ============================================================

export class CreateMaterialProcurementDto {
  // ----------------------------------------------------------
  // PROJECT
  // ----------------------------------------------------------

  @IsUUID()
  projectId: string;

  // ----------------------------------------------------------
  // STATUS
  // ----------------------------------------------------------

  @IsOptional()
  @IsEnum(MaterialProcurementStatus)
  status?: MaterialProcurementStatus;

  // ----------------------------------------------------------
  // REMARKS
  // ----------------------------------------------------------

  @IsOptional()
  @IsString()
  remarks?: string;

  // ----------------------------------------------------------
  // SHEETS (material types, in order)
  // ----------------------------------------------------------

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MaterialProcurementSheetDto)
  sheets?: MaterialProcurementSheetDto[];

  // ----------------------------------------------------------
  // ITEMS
  // ----------------------------------------------------------

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMaterialProcurementItemDto)
  items: CreateMaterialProcurementItemDto[];
}
