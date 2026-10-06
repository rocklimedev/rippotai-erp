import {
  IsString,
  IsInt,
  IsOptional,
  IsEnum,
  IsArray,
  MaxLength,
  IsDateString,
  IsUUID,
} from 'class-validator';
import { RfiPriority } from '../../../common/enums/site-operations.enums';

export class RaiseRfiDto {
  @IsUUID()
  projectId: string;

  @IsOptional()
  @IsUUID()
  stepId?: string;

  @IsString()
  @MaxLength(200)
  subject: string;

  @IsString()
  query: string;

  @IsString()
  @MaxLength(150)
  raisedBy: string;

  @IsOptional()
  @IsDateString()
  raisedAt?: string;

  @IsOptional()
  @IsEnum(RfiPriority)
  priority?: RfiPriority;

  @IsUUID()
  routedToTeamId: string;

  @IsOptional()
  @IsArray()
  attachmentUrls?: string[];
}

export class RespondToRfiDto {
  @IsString()
  response: string;

  @IsString()
  @MaxLength(150)
  respondedBy: string;
}

export class RerouteRfiDto {
  @IsUUID()
  routedToTeamId: string;
}
