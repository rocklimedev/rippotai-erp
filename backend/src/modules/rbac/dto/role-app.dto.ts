// modules/rbac/dto/role-app.dto.ts
import {
  IsString,
  IsUUID,
  IsOptional,
  IsArray,
  ArrayNotEmpty,
} from 'class-validator';

export class CreateRoleAppDto {
  @IsUUID()
  role_id: string;

  @IsString()
  app_code: string;

  @IsUUID()
  @IsOptional()
  granted_by?: string;
}

export class BulkAssignAppsDto {
  @IsUUID()
  role_id: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  app_codes: string[];

  @IsUUID()
  @IsOptional()
  granted_by?: string;
}
