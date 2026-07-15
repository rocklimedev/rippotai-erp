import {
  IsArray,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IsValidSections } from '@/common/validators/is-valid-sections.validator';
import { REKI_SECTIONS } from '@/common/constants/document-sections.constants';
import { SiteRekiAttachmentDto } from './attachment.dto';

export type RekiSectionValues = Record<string, Record<string, string>>;

export class CreateSiteRekiDto {
  @IsUUID()
  @IsNotEmpty()
  project_id: string;

  // Keyed exactly like the frontend `values` state for REKI_SECTIONS
  @IsObject()
  @IsValidSections(REKI_SECTIONS, {
    message: 'sections must only contain known Site Reki section/field keys',
  })
  sections: RekiSectionValues;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SiteRekiAttachmentDto)
  attachments?: SiteRekiAttachmentDto[];
}
