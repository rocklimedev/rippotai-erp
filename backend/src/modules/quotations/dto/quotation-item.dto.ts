import { PartialType } from '@nestjs/mapped-types';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateQuotationItemDto {
  @IsOptional()
  @IsUUID()
  quotation_id?: string; // optional when nested under a CreateQuotationDto

  @IsInt()
  @Min(1)
  sno: number;

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
  amount?: number; // computed as rate * quantity if omitted

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class UpdateQuotationItemDto extends PartialType(
  CreateQuotationItemDto,
) {}
