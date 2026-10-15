import { IsEmail, IsString, IsUUID, MinLength } from 'class-validator';
import { PASSWORD_MIN_LENGTH } from '@/common/security/password-policy';

export class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @MinLength(PASSWORD_MIN_LENGTH)
  password: string;

  @IsString()
  role: string;

  @IsUUID()
  createdBy: string;
}
