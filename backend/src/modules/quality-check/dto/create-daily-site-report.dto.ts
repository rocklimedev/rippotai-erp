import {
  IsUUID,
  IsDateString,
  IsOptional,
  IsString,
  IsInt,
  Min,
  MaxLength,
} from 'class-validator';

export class CreateDailySiteReportDto {
  @IsUUID()
  projectId: string;

  @IsDateString()
  reportDate: string;

  @IsOptional()
  @IsUUID()
  supervisorId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  weather?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  manpowerCount?: number;

  @IsOptional()
  @IsString()
  workDone?: string;

  @IsOptional()
  @IsString()
  issues?: string;

  @IsOptional()
  @IsUUID()
  photosDocumentId?: string;
}
