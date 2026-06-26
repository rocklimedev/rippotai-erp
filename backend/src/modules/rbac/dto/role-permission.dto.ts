import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateRolePermissionDto {
  @IsUUID()
  @IsNotEmpty()
  role_id: string;

  @IsUUID()
  @IsNotEmpty()
  permission_id: string;

  @IsOptional()
  @IsUUID()
  granted_by?: string;
}

// Grant assignments are immutable by nature (role_id + permission_id form the
// key) - "update" just means revoke and re-grant, so no UpdateDto is exposed.
export class BulkAssignPermissionsDto {
  @IsUUID()
  @IsNotEmpty()
  role_id: string;

  permission_ids: string[];

  @IsOptional()
  @IsUUID()
  granted_by?: string;
}
