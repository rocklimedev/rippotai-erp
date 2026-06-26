import { IsArray, IsDateString, IsUUID, ValidateNested } from 'class-validator';

import { Type } from 'class-transformer';

export class CreateQuotationItemDto {
  sno: number;
  particular: string;
  rate: number;
  quantity: number;
  remarks?: string;
}

export class CreateQuotationDto {
  @IsDateString()
  quotationDate: string;

  @IsUUID()
  projectId: string;

  @IsUUID()
  vendorId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuotationItemDto)
  items: CreateQuotationItemDto[];
}
