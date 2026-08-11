import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import {
  EstimateCategory,
  EstimateSourcePath,
} from '@/common/enums/estimate.enums';
import { EstimateItemDto } from './estimate-item.dto';

export class CreateEstimateDto {
  @IsString()
  estimateNumber: string;

  @IsUUID()
  projectId: string;

  @IsOptional()
  @IsUUID()
  vendorId?: string;

  @IsOptional()
  @IsUUID()
  tradeTeamId?: string;

  @IsOptional()
  @IsEnum(EstimateSourcePath)
  sourcePath?: EstimateSourcePath;

  @IsOptional()
  @IsEnum(EstimateCategory)
  category?: EstimateCategory;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => EstimateItemDto)
  items: EstimateItemDto[];
}
