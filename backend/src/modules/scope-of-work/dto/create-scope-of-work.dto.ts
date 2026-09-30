import {
  IsDateString,
  IsNumber,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateScopeOfWorkDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalAreaSqft?: number;

  @IsOptional()
  @IsDateString()
  documentDate?: string;

  @IsOptional()
  @IsUUID()
  reviewedBy?: string;

  @IsOptional()
  @IsString()
  authorisedSignatoryName?: string;

  @IsOptional()
  @IsDateString()
  authorisedSignatoryDate?: string;

  @IsOptional()
  @IsString()
  clientSignatureName?: string;

  @IsOptional()
  @IsDateString()
  clientSignatureDate?: string;

  @IsOptional()
  @IsString()
  scopeSummary?: string;

  @IsOptional()
  @IsString()
  specificExclusions?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  projectMode?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  version?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsUUID()
  preparedBy?: string;
}
