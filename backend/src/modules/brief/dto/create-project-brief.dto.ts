import { IsNotEmpty, IsObject, IsUUID } from 'class-validator';
import { IsValidSections } from '@/common/validators/is-valid-sections.validator';
import { BRIEF_SECTIONS } from '@/common/constants/document-sections.constants';

export type BriefSectionValues = Record<string, Record<string, string>>;

export class CreateProjectBriefDto {
  @IsUUID()
  @IsNotEmpty()
  project_id: string;

  // Keyed exactly like the frontend `values` state: { [sectionTitle]: { [fieldKey]: string } }
  @IsObject()
  @IsValidSections(BRIEF_SECTIONS, {
    message:
      'sections must only contain known Project Brief section/field keys',
  })
  sections: BriefSectionValues;
}
