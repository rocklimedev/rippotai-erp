import { IsOptional } from 'class-validator';

export class UpdateInventoryRequestDto {
  @IsOptional()
  material_id?: string;

  @IsOptional()
  quantity_required?: number;

  @IsOptional()
  required_date?: string;

  @IsOptional()
  vendor_id?: string;

  @IsOptional()
  source_type?: 'Vendor' | 'Warehouse';

  @IsOptional()
  status?: 'requested' | 'approved' | 'dispatched' | 'delivered';

  @IsOptional()
  approved_by?: string;
}
