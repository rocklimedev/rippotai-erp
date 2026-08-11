import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateContractorLineupDto {
  @IsUUID()
  projectId: string;

  @IsUUID()
  tradeTeamId: string;

  @IsUUID()
  vendorId: string;

  @IsOptional()
  @IsUUID()
  quotationId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
