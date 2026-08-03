import { IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class UpdateInventoryDispatchDto {
  @IsOptional()
  dispatch_date?: Date;

  @IsOptional()
  @IsNumber()
  dispatch_quantity?: number;

  @IsOptional()
  vehicle_challan?: string;

  @IsOptional()
  @IsNumber()
  received_quantity?: number;

  @IsOptional()
  @IsBoolean()
  damage_shortage?: boolean;

  @IsOptional()
  @IsBoolean()
  supervisor_confirmation?: boolean;

  @IsOptional()
  delivery_photo_url?: string;
}
