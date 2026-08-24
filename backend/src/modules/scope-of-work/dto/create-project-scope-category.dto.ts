import { IsBoolean, IsInt, IsUUID, IsOptional, Min } from 'class-validator';

export class CreateProjectScopeCategoryDto {
  @IsUUID()
  scopeCategoryId: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
