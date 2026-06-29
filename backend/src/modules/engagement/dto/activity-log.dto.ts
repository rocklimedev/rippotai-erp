import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ActivityAction } from '../../../common/enums';

export class CreateActivityLogDto {
  @IsOptional()
  @IsUUID()
  user_id?: string | null;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  user_email?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  user_role?: string;

  @IsEnum(ActivityAction)
  action: ActivityAction;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  entity_type?: string;

  @IsOptional()
  @IsUUID()
  entity_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  entity_label?: string;

  @IsOptional()
  @IsObject()
  changes?: Record<string, any>;

  @IsOptional()
  @IsString()
  ip_address?: string;

  @IsOptional()
  @IsString()
  user_agent?: string;
}
