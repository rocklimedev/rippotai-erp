import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { LeadStage } from '@/common/enums/leads.enums';

export class MoveStageDto {
  @IsEnum(LeadStage)
  @IsNotEmpty()
  stage: LeadStage;

  // optional suffix appended to the auto-generated activity line, e.g. "(drag)"
  @IsOptional()
  @IsString()
  via?: string;
}
