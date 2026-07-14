import { IsOptional, IsString, IsUUID } from 'class-validator';

export class UploadDrawingDto {
  @IsUUID()
  project_id: string;

  @IsString()
  title: string;

  @IsString()
  drawing_number: string;

  @IsOptional()
  @IsString()
  discipline?: string;

  @IsOptional()
  @IsString()
  revision?: string;

  @IsOptional()
  @IsString()
  issue_date?: string;

  @IsOptional()
  @IsString()
  issue_purpose?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}
