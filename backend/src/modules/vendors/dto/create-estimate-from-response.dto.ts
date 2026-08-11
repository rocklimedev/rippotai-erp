import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { EstimateCategory } from '@/common/enums/estimate.enums';
import { EstimateItemDto } from '@/modules/quotations/dto/estimate-item.dto';

export class CreateEstimateFromResponseDto {
  @IsString()
  estimateNumber: string;

  @IsOptional()
  @IsEnum(EstimateCategory)
  category?: EstimateCategory;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => EstimateItemDto)
  items: EstimateItemDto[];
}
