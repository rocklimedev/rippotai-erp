import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { NotificationType } from '../../../common/enums';

export class CreateNotificationDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  entity_type?: string;

  @IsOptional()
  @IsUUID()
  entity_id?: string;

  @IsUUID()
  @IsNotEmpty()
  user_id: string;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}
