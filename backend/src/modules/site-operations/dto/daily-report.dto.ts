import {
  IsString,
  IsInt,
  IsOptional,
  IsEnum,
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsUUID,
  ValidateNested,
  MaxLength,
  IsDateString,
  IsNotEmpty,
  Min,
  Max,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType, OmitType } from '@nestjs/mapped-types';
import { WeatherCondition } from '../../../common/enums/site-operations.enums';

export const SITE_CONDITIONS = [
  'NORMAL',
  'WET',
  'WATERLOGGED',
  'DUSTY',
  'RESTRICTED',
  'CLOSED',
] as const;
export const REPORT_STATUSES = ['DRAFT', 'SUBMITTED'] as const;
export const ISSUE_TYPES = [
  'DELAY',
  'MATERIAL',
  'MANPOWER',
  'DESIGN',
  'CLIENT',
  'WEATHER',
  'QUALITY',
  'SAFETY',
  'OTHER',
] as const;
export const ISSUE_IMPACTS = ['NONE', 'LOW', 'MEDIUM', 'HIGH'] as const;

export class ManpowerEntryInputDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  trade: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  contractorName?: string;

  @IsInt()
  @Min(0)
  @Max(5000)
  headcount: number;
}

export class WorkItemDto {
  @IsString()
  @IsNotEmpty()
  activity: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  location?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  progress?: number;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class MaterialLineDto {
  @IsIn(['RECEIVED', 'USED'])
  direction: 'RECEIVED' | 'USED';

  @IsOptional()
  @IsUUID()
  materialId?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  unit?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class EquipmentLineDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  count?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  hours?: number;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class IssueLineDto {
  @IsIn(ISSUE_TYPES as unknown as string[])
  type: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsIn(ISSUE_IMPACTS as unknown as string[])
  impact?: string;

  @IsOptional()
  @IsBoolean()
  needsAttention?: boolean;
}

export class PhotoLineDto {
  @IsString()
  @IsNotEmpty()
  url: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  caption?: string;

  @IsOptional()
  @IsString()
  filename?: string;
}

export class CreateDailySiteReportDto {
  @IsUUID()
  projectId: string;

  @IsDateString()
  reportDate: string;

  @IsOptional()
  @IsIn(REPORT_STATUSES as unknown as string[])
  status?: string;

  @IsOptional()
  @IsEnum(WeatherCondition)
  weatherCondition?: WeatherCondition;

  @IsOptional()
  @IsString()
  weatherNotes?: string;

  @IsOptional()
  @IsIn(SITE_CONDITIONS as unknown as string[])
  siteCondition?: string;

  @IsOptional()
  @IsString()
  workCompleted?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => WorkItemDto)
  workItems?: WorkItemDto[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => ManpowerEntryInputDto)
  manpower?: ManpowerEntryInputDto[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => MaterialLineDto)
  materials?: MaterialLineDto[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => EquipmentLineDto)
  equipment?: EquipmentLineDto[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => IssueLineDto)
  issueItems?: IssueLineDto[];

  /** Legacy free-text issues. */
  @IsOptional()
  @IsString()
  issues?: string;

  @IsOptional()
  @IsBoolean()
  safetyIncident?: boolean;

  @IsOptional()
  @IsString()
  safetyNotes?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(40)
  @ValidateNested({ each: true })
  @Type(() => PhotoLineDto)
  photos?: PhotoLineDto[];

  @IsOptional()
  @IsString()
  nextDayPlan?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  reportedBy: string;

  @IsOptional()
  @IsBoolean()
  shareWithClient?: boolean;
}

/** Everything except the project can be changed (date too, subject to the one-per-day rule). */
export class UpdateDailySiteReportDto extends PartialType(
  OmitType(CreateDailySiteReportDto, ['projectId'] as const),
) {}
