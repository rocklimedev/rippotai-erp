import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class ScopeOfWorkSpaceDto {
  @IsString()
  clientId: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

class ScopeOfWorkItemDto {
  @IsString()
  clientId: string;

  @IsOptional()
  @IsUUID()
  projectSpaceId?: string;

  @IsUUID()
  scopeCategoryId: string;

  @IsString()
  scopeOfWork: string;

  @IsOptional()
  @IsBoolean()
  isIncluded?: boolean;

  @IsOptional()
  @IsBoolean()
  isExcluded?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class CreateCompleteScopeOfWorkDto {
  @IsOptional()
  @IsString()
  scopeSummary?: string;

  @IsOptional()
  @IsString()
  specificExclusions?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  projectMode?: string;

  @IsOptional()
  @IsInt()
  version?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScopeOfWorkSpaceDto)
  spaces: ScopeOfWorkSpaceDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScopeOfWorkItemDto)
  items: ScopeOfWorkItemDto[];
}
