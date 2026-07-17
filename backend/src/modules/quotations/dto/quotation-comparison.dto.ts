import { IsString, IsUUID, IsArray, IsNotEmpty } from 'class-validator';

export class CreateQuotationComparisonDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsUUID()
  project_id: string;

  @IsString()
  work_category?: string;

  @IsArray()
  @IsUUID(undefined, { each: true })
  quotation_ids: string[];
}

export class QuotationCompareQueryDto {
  ids: string; // comma-separated
}
