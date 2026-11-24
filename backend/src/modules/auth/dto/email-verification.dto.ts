import { IsEmail, IsIn, IsOptional, IsString, Matches } from 'class-validator';

export class RequestEmailVerificationDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsIn(['link', 'code'])
  delivery?: 'link' | 'code';
}

export class VerifyEmailDto {
  @IsString()
  @Matches(/^(?:[a-f0-9]{64}|[2-9A-HJ-NP-Z]{16})$/)
  token: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
