import {
  IsString,
  IsInt,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsArray,
  ValidateNested,
  MaxLength,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  QcResult,
  QcItemResult,
} from '../../../common/enums/site-operations.enums';

export class CreateChecklistItemDto {
  @IsString()
  @MaxLength(300)
  text: string;

  @IsInt()
  order: number;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;
}

export class CreateChecklistTemplateDto {
  @IsString()
  @MaxLength(150)
  name: string;

  @IsInt()
  tradeTeamId: number;

  @IsOptional()
  @IsInt()
  stepId?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateChecklistItemDto)
  items?: CreateChecklistItemDto[];
}

export class AddChecklistItemDto extends CreateChecklistItemDto {
  @IsInt()
  templateId: number;
}

export class QcItemResultInputDto {
  @IsInt()
  templateItemId: number;

  @IsEnum(QcItemResult)
  result: QcItemResult;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class RecordQcSignOffDto {
  @IsInt()
  projectId: number;

  @IsInt()
  stepId: number;

  @IsInt()
  tradeTeamId: number;

  @IsInt()
  checklistTemplateId: number;

  @IsEnum(QcResult)
  result: QcResult;

  @IsString()
  @MaxLength(150)
  checkedBy: string;

  @IsOptional()
  @IsDateString()
  checkedAt?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QcItemResultInputDto)
  itemResults?: QcItemResultInputDto[];
}
