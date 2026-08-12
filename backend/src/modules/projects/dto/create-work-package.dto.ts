import {
  IsUUID,
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  IsDateString,
  MaxLength,
  Min,
} from 'class-validator';
import { WorkPackageStatus } from '../models/work-package.model';

export class CreateWorkPackageDto {
  @IsUUID()
  projectId: string;

  @IsOptional()
  @IsUUID()
  boqId?: string;

  @IsOptional()
  @IsUUID()
  tradeTeamId?: string;

  @IsOptional()
  @IsUUID()
  vendorId?: string;

  @IsString()
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  totalValue?: number;

  @IsOptional()
  @IsEnum(WorkPackageStatus)
  status?: WorkPackageStatus;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
