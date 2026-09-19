// dto/role.dto.ts
import { IsString, IsOptional, IsArray, IsIn, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @IsOptional()
  @IsIn(['INTERNAL', 'PROJECT'])
  scope?: 'INTERNAL' | 'PROJECT';

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  app_codes?: string[];
}

export class UpdateRoleDto {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @MaxLength(50)
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  app_codes?: string[];
}
