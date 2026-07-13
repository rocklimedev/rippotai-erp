import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateBoqDto {
  @IsUUID()
  project_id: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsUUID()
  template_id?: string;
}
