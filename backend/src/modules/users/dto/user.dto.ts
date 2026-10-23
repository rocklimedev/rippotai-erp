import {
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsUUID,
  MinLength,
  MaxLength,
} from 'class-validator';
import { PASSWORD_MIN_LENGTH } from '@/common/security/password-policy';

export class CreateUserDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
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

}

// Fields a user is allowed to change from the "Profile Settings" screen.
// Role, account status and password changes use separate admin endpoints.
// Creator attribution is always supplied by the authenticated actor.
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
  @MinLength(PASSWORD_MIN_LENGTH)
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

}
