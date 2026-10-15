import { IsString, MinLength, Matches } from 'class-validator';
import { PASSWORD_MIN_LENGTH } from '@/common/security/password-policy';

export class ResetPasswordDto {
  @IsString()
  @Matches(/^[a-f0-9]{64}$/)
  token: string;

  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  password: string;
}
