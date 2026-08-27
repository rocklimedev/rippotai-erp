import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateDrawingDto {
  @IsUUID()
  projectId: string;

  @IsOptional()
  @IsUUID()
  documentTypeId?: string;

  @IsOptional()
  @IsUUID()
  requirementId?: string;

  @IsString()
  @MaxLength(255)
  title: string;

  @IsString()
  @MaxLength(255)
  drawingNumber: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phaseCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  discipline?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  sheetNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  scale?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  issuePurpose?: string;

  @IsOptional()
  @IsIn(['Draft', 'For Review', 'Approved', 'Rejected', 'Superseded'])
  status?: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsInt()
  sequence?: number;

  @IsOptional()
  @IsUUID()
  drawnBy?: string;

  @IsOptional()
  @IsUUID()
  checkedBy?: string;

  @IsOptional()
  @IsUUID()
  approvedBy?: string;
}
