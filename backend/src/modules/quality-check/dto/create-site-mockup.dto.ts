import {
  IsUUID,
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { SiteMockupStatus } from '../models/site-mockup.model';

export class CreateSiteMockupDto {
  @IsUUID()
  projectId: string;

  @IsString()
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsUUID()
  tradeTeamId?: string;

  @IsOptional()
  @IsEnum(SiteMockupStatus)
  status?: SiteMockupStatus;

  @IsOptional()
  @IsUUID()
  documentId?: string;

  @IsOptional()
  @IsUUID()
  reviewedBy?: string;

  @IsOptional()
  @IsDateString()
  reviewedAt?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}
