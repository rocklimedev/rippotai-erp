import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsString,
  IsUUID,
} from 'class-validator';
import { VerificationTokenType } from '../../../common/enums';

export class CreateVerificationTokenDto {
  @IsUUID()
  @IsNotEmpty()
  user_id: string;

  @IsString()
  @IsNotEmpty()
  token: string;

  @IsEnum(VerificationTokenType)
  type: VerificationTokenType;

  @IsDateString()
  expires_at: string;
}
