import { Type } from 'class-transformer';
import {
  IsUUID,
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsBoolean,
  IsDateString,
  IsArray,
  ValidateNested,
  MaxLength,
  Min,
} from 'class-validator';

import { PaymentScheduleStatus } from '../models/payment-schedule.model';
import { CreateMilestoneDto } from './create-milestone.dto';

export class CreatePaymentScheduleDto {
  @IsUUID()
  projectId: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  // ============================================================
  // TERMS
  // ============================================================

  @IsOptional()
  @IsUUID()
  termsTemplateId?: string;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(1)
  termsVersion?: number;

  // ============================================================
  // FINANCIALS
  // ============================================================

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  totalContractValue: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  gstRate?: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  gstAmount?: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalPayable?: number;

  // ============================================================
  // STATUS
  // ============================================================

  @IsOptional()
  @IsEnum(PaymentScheduleStatus)
  status?: PaymentScheduleStatus;

  // ============================================================
  // CLIENT ACCEPTANCE
  // ============================================================

  @IsOptional()
  @IsBoolean()
  acceptedByClient?: boolean;

  @IsOptional()
  @IsDateString()
  acceptedAt?: string;

  // ============================================================
  // MILESTONES
  // ============================================================

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMilestoneDto)
  milestones?: CreateMilestoneDto[];
}
