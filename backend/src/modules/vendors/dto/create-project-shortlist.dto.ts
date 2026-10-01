import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ShortlistType } from '@/common/enums/shortlist.enums';

export class CreateProjectShortlistDto {
  @IsUUID()
  @IsNotEmpty()
  project_id: string;

  @IsEnum(ShortlistType)
  @IsNotEmpty()
  shortlist_type: ShortlistType;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
