import { IsNotEmpty, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class CreateInventoryMasterDto {
  @IsNotEmpty()
  item_code!: string;

  @IsNotEmpty()
  item_name!: string;

  @IsOptional()
  description?: string;

  @IsOptional()
  unit_id?: string;

  @IsNotEmpty()
  @IsNumber()
  default_rate!: number;

  @IsOptional()
  brand?: string;

  @IsOptional()
  specification?: string;
}
