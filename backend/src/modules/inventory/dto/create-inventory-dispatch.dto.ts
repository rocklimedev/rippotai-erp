import { IsNotEmpty, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class CreateInventoryDispatchDto {
  @IsNotEmpty()
  request_id!: string;

  @IsOptional()
  dispatch_date?: Date;

  @IsNotEmpty()
  @IsNumber()
  dispatch_quantity!: number;

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
