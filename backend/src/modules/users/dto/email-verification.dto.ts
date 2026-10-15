import { IsBoolean } from 'class-validator';

export class UpdateEmailVerificationDto {
  @IsBoolean()
  verified: boolean;
}
