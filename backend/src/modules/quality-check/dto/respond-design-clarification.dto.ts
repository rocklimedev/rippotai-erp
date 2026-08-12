import { IsUUID, IsString, IsOptional, IsEnum } from 'class-validator';
import { DesignClarificationStatus } from '../models/design-clarification.model';

export class RespondDesignClarificationDto {
  @IsString()
  response: string;

  @IsOptional()
  @IsUUID()
  respondedBy?: string;

  @IsOptional()
  @IsEnum(DesignClarificationStatus)
  status?: DesignClarificationStatus;
}
