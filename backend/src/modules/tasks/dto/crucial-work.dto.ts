import { IsDateString, IsIn, IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';

export class CrucialWorkQueryDto {
  @IsOptional()
  @IsUUID()
  project_id?: string;

  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  cycle_date: string;

  @IsIn(['daily', 'weekly'])
  cycle: 'daily' | 'weekly';
}

export class CrucialWorkExportDto extends CrucialWorkQueryDto {
  @IsIn(['docx', 'pdf'])
  format: 'docx' | 'pdf';
}

export class SaveCrucialCheckDto {
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  cycle_date: string;

  @IsIn(['daily', 'weekly'])
  cycle: 'daily' | 'weekly';

  @IsIn(['checked', 'in_progress', 'not_checked'])
  check_status: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  follow_up?: string | null;
}
