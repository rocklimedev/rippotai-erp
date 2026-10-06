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
  IsUUID,
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

  @IsUUID()
  tradeTeamId: string;

  @IsOptional()
  @IsUUID()
  stepId?: string;

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
  @IsUUID()
  templateId: string;
}

export class QcItemResultInputDto {
  @IsUUID()
  templateItemId: string;

  @IsEnum(QcItemResult)
  result: QcItemResult;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class RecordQcSignOffDto {
  @IsUUID()
  projectId: string;

  @IsUUID()
  stepId: string;

  @IsUUID()
  tradeTeamId: string;

  @IsUUID()
  checklistTemplateId: string;

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
