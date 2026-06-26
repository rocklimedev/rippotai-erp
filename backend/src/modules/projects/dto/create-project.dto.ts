import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ProjectStatus } from '@/common/enums';
export class CreateProjectDto {
  @IsString()
  name: string;

  @IsString()
  siteLocation: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;
}
