import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { CreateShortlistEntryDto } from './create-shortlist-entry.dto';

/**
 * Bulk create entries for a project shortlist.
 * Useful when seeding the standard 12 trades × 3 working types skeleton.
 */
export class BulkCreateShortlistEntriesDto {
  @IsUUID()
  @IsNotEmpty()
  project_shortlist_id: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateShortlistEntryDto)
  entries: CreateShortlistEntryDto[];
}
