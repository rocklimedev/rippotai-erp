import {
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsUUID,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  job_title?: string;

  // role is assignable on create (e.g. by an admin) but never editable
  // by the user themselves from the profile screen
  @IsOptional()
  @IsUUID()
  role_id?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsUUID()
  created_by?: string;
}

// Fields a user is allowed to change from the "Profile Settings" screen.
// Deliberately excludes role_id, is_active, created_by, password -
// those are admin-only concerns and go through separate endpoints.
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  job_title?: string;
}

// Full update DTO retained for admin-facing user management (unchanged
// behavior from before - role_id, is_active, etc. still editable here).
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  job_title?: string;

  @IsOptional()
  @IsUUID()
  role_id?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsUUID()
  created_by?: string;
}