import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import {
  ShortlistType,
  Trade,
  WorkingType,
  ShortlistEntryStatus,
} from '@/common/enums/shortlist.enums';

export class QueryProjectShortlistDto {
  @IsOptional()
  @IsUUID()
  project_id?: string;

  @IsOptional()
  @IsEnum(ShortlistType)
  shortlist_type?: ShortlistType;
}

export class QueryShortlistEntryDto {
  @IsOptional()
  @IsUUID()
  project_shortlist_id?: string;

  @IsOptional()
  @IsEnum(Trade)
  trade?: Trade;

  @IsOptional()
  @IsEnum(WorkingType)
  working_type?: WorkingType;

  @IsOptional()
  @IsEnum(ShortlistEntryStatus)
  status?: ShortlistEntryStatus;

  @IsOptional()
  @IsUUID()
  vendor_id?: string;

  @IsOptional()
  @IsUUID()
  material_id?: string;
}
