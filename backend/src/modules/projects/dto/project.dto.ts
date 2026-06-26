import { PartialType } from '@nestjs/mapped-types';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { ProjectStatus } from '../../../common/enums';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  site_location: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @IsNumber()
  @Min(0)
  approved_value?: number;

  @IsOptional()
  @IsUUID()
  created_by?: string;
}

export class UpdateProjectDto extends PartialType(CreateProjectDto) {
  @IsOptional()
  @IsUUID()
  updated_by?: string;
}
