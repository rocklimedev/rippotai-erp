import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { PASSWORD_MIN_LENGTH } from '@/common/security/password-policy';

export class SignupDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  password: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  job_title?: string;

  @IsOptional()
  @IsString()
  avatar_url?: string;
}
