import {
  IsString,
  IsInt,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  MaxLength,
  IsDateString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { WeatherCondition } from '../../../common/enums/site-operations.enums';

export class ManpowerEntryInputDto {
  @IsInt()
  teamId: number;

  @IsInt()
  @Min(0)
  headcount: number;
}

export class CreateDailySiteReportDto {
  @IsInt()
  projectId: number;

  @IsDateString()
  reportDate: string;

  @IsOptional()
  @IsEnum(WeatherCondition)
  weatherCondition?: WeatherCondition;

  @IsOptional()
  @IsString()
  weatherNotes?: string;

  @IsString()
  workCompleted: string;

  @IsOptional()
  @IsString()
  issues?: string;

  @IsString()
  @MaxLength(150)
  reportedBy: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ManpowerEntryInputDto)
  manpower?: ManpowerEntryInputDto[];
}

export class UpdateDailySiteReportDto {
  @IsOptional()
  @IsEnum(WeatherCondition)
  weatherCondition?: WeatherCondition;

  @IsOptional()
  @IsString()
  weatherNotes?: string;

  @IsOptional()
  @IsString()
  workCompleted?: string;

  @IsOptional()
  @IsString()
  issues?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ManpowerEntryInputDto)
  manpower?: ManpowerEntryInputDto[];
}
