import {
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
} from 'class-validator';

const CATEGORIES = [
  'Agreements',
  'Pitch',
  'Scope of Work',
  'Time and Cost',
  'Project Brief',
  'Site Reki',
  'BOQs',
  'Quotations',
  'Drawings',
  'GFC Drawings',
  '3D Views',
  'Approvals',
  'Other',
  'Handover Documents',
];

export class UpdateDocumentDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsIn(CATEGORIES)
  category?: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  // Empty string from the <select> means "unassign project" — the service
  // treats '' the same as null.
  @IsOptional()
  @ValidateIf((o) => o.project_id !== '')
  @IsUUID(undefined, { message: 'project_id must be a UUID or empty' })
  project_id?: string;
}
