import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';

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

export class CreateDocumentDto {
  @IsUUID()
  project_id: string;

  @IsIn(CATEGORIES)
  category: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsIn(['internal', 'client'])
  visibility?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}
