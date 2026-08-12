import { IsUUID, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateQcChecklistTemplateDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsUUID()
  tradeTeamId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  createdBy?: string;
}
