import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsString,
} from 'class-validator';

export class CreateVendorBusinessTypeDto {
  @IsUUID()
  @IsNotEmpty()
  category_id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsBoolean()
  @IsOptional()
  status?: boolean;
}
