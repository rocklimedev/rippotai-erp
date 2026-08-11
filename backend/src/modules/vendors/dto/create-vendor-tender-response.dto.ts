import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsUUID,
} from 'class-validator';

import {
  TenderResponsePath,
  TenderResponseStatus,
} from '@/common/enums/estimate.enums';
export class CreateVendorTenderResponseDto {
  @IsUUID()
  projectId: string;

  @IsUUID()
  vendorId: string;

  @IsOptional()
  @IsUUID()
  tradeTeamId?: string;

  @IsOptional()
  @IsEnum(TenderResponsePath)
  declare responsePath: TenderResponsePath;
  @IsOptional()
  @IsUUID()
  rawQuoteDocumentId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  submittedAmount?: number;

  @IsOptional()
  @IsDateString()
  receivedAt?: string;
}
