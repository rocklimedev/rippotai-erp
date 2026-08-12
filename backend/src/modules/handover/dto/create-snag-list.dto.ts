import { IsUUID, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { SnagListStatus } from '../models/snag-list.model';

export class CreateSnagListDto {
  @IsUUID()
  projectId: string;

  @IsOptional()
  @IsDateString()
  walkthroughDate?: string;

  @IsOptional()
  @IsEnum(SnagListStatus)
  status?: SnagListStatus;

  @IsOptional()
  @IsUUID()
  createdBy?: string;
}
