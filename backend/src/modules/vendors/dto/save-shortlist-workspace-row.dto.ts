import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { UpdateShortlistEntryDto } from './update-shortlist-entry.dto';
import { Trade, WorkingType } from '@/common/enums/shortlist.enums';
import { OmitType } from '@nestjs/mapped-types';

export class SaveShortlistWorkspaceRowDto extends OmitType(
  UpdateShortlistEntryDto,
  ['trade', 'working_type'] as const,
) {
  @IsEnum(Trade)
  declare trade: Trade;

  @IsEnum(WorkingType)
  declare working_type: WorkingType;

  // Allows an explicitly identified orphan to be repaired without guessing.
  @IsOptional()
  @IsUUID()
  entry_id?: string;
}
