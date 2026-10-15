import { IsEmail, IsString, Matches } from 'class-validator';

export class RequestEmailVerificationDto {
  @IsEmail()
  email: string;
}

export class VerifyEmailDto {
  @IsString()
  @Matches(/^[a-f0-9]{64}$/)
  token: string;
}
