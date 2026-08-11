import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateVendorSiteMeasurementDto {
  @IsUUID()
  projectId: string;

  @IsUUID()
  vendorId: string;

  @IsOptional()
  @IsUUID()
  tradeTeamId?: string;

  @IsOptional()
  @IsDateString()
  measuredAt?: string;

  @IsOptional()
  @IsUUID()
  documentId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
