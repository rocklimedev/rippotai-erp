import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { AuthTokenType } from '@/common/enums';
export class CreateAuthTokenDto {
  @IsUUID()
  @IsNotEmpty()
  user_id: string;

  @IsString()
  @IsNotEmpty()
  token_hash: string;

  @IsOptional()
  @IsEnum(AuthTokenType)
  type?: AuthTokenType;

  @IsOptional()
  @IsString()
  device_info?: string;

  @IsOptional()
  @IsString()
  ip_address?: string;

  @Type(() => Date)
  @IsDate()
  expires_at: Date;
}
