import {
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
  IsNumber,
} from 'class-validator';

export class CreateInventoryRequestDto {
  @IsNotEmpty()
  project_id!: string;

  @IsNotEmpty()
  project_material_id!: string; // ✅ REQUIRED (fix for Sequelize crash)

  @IsNumber()
  quantity_required!: number;

  @IsOptional()
  required_date?: string;

  @IsOptional()
  vendor_id?: string;

  @IsNotEmpty()
  @IsEnum(['Vendor', 'Warehouse'])
  source_type!: 'Vendor' | 'Warehouse';

  @IsOptional()
  requested_by?: string;
}
