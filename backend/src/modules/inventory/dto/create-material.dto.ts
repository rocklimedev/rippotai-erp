import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProjectMaterialDto {
  @IsNotEmpty()
  @IsString()
  item_name: string;

  @IsNotEmpty()
  @IsString()
  project_id: string;

  @IsOptional()
  @IsString()
  inventory_master_id?: string;

  @IsOptional()
  @IsString()
  item_code?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  specification?: string;

  @IsOptional()
  @IsString()
  unit_id?: string;

  @IsOptional()
  @IsString()
  brand_id?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  quantity_estimated?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  quantity_required?: number;

  // ✅ ADD THIS
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  quantity_received?: number;

  // ✅ ADD THIS
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  quantity_used?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  rate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  gst_percent?: number;

  @IsOptional()
  @IsEnum(['planned', 'ordered', 'received', 'in_use', 'closed'])
  status?: 'planned' | 'ordered' | 'received' | 'in_use' | 'closed';

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsString()
  category?: string;
}
