import { Type } from 'class-transformer';
import {
  IsInt,
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsDateString,
  MaxLength,
  Min,
  Max,
} from 'class-validator';

import { MilestoneStatus } from '../models/payment-schedule-milestone.model';

export class CreateMilestoneDto {
  @Type(() => Number)
  @IsInt()
  milestoneNumber: number;

  @IsString()
  @MaxLength(20)
  milestoneCode: string;

  @IsString()
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  releaseTrigger?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  percentage: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsEnum(MilestoneStatus)
  status?: MilestoneStatus;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsDateString()
  invoiceDate?: string;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  paidAmount?: number;

  @IsOptional()
  @IsDateString()
  paidAt?: string;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
