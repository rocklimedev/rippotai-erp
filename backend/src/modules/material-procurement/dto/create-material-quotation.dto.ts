import { IsString, IsNotEmpty, IsDateString, IsOptional } from 'class-validator';

/**
 * Quotations may only be generated from an estimate that is already
 * ApprovalStatus.APPROVED — enforced in MaterialQuotationService,
 * identical to the trades estimate → approval → quotation rule.
 */
export class CreateMaterialQuotationDto {
  @IsString() @IsNotEmpty()
  estimateId: string;

  @IsString() @IsNotEmpty()
  quotationNumber: string;

  @IsDateString()
  quotationDate: string;

  @IsOptional() @IsString()
  terms?: string;
}
