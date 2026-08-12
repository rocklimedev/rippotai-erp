import {
  IsUUID,
  IsOptional,
  IsString,
  IsEnum,
  MaxLength,
} from 'class-validator';
import { SnagItemStatus } from '../models/snag-item.model';

export class CreateSnagItemDto {
  @IsUUID()
  snagListId: string;

  @IsOptional()
  @IsUUID()
  tradeTeamId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsUUID()
  photoDocumentId?: string;

  @IsOptional()
  @IsEnum(SnagItemStatus)
  status?: SnagItemStatus;

  @IsOptional()
  @IsUUID()
  assignedTo?: string;
}
