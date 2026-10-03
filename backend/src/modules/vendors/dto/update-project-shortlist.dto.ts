import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProjectShortlistDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  is_locked?: boolean;
}
