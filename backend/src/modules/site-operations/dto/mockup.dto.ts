import {
  IsString,
  IsInt,
  IsOptional,
  IsEnum,
  IsArray,
  MaxLength,
  IsDateString,
} from 'class-validator';
import { MockupStatus } from '../../../common/enums/site-operations.enums';

export class ProposeMockupDto {
  @IsInt()
  projectId: number;

  @IsOptional()
  @IsInt()
  stepId?: number;

  @IsString()
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  finishType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  referenceImageUrls?: string[];

  @IsString()
  @MaxLength(150)
  proposedBy: string;

  @IsOptional()
  @IsDateString()
  proposedAt?: string;
}

export class ReviewMockupDto {
  @IsEnum(MockupStatus)
  status: MockupStatus; // UNDER_REVIEW | APPROVED | REJECTED

  @IsString()
  @MaxLength(150)
  reviewedBy: string;

  @IsOptional()
  @IsString()
  reviewNotes?: string;
}
