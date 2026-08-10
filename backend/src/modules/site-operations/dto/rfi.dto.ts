import {
  IsString,
  IsInt,
  IsOptional,
  IsEnum,
  IsArray,
  MaxLength,
  IsDateString,
} from 'class-validator';
import { RfiPriority } from '../../../common/enums/site-operations.enums';

export class RaiseRfiDto {
  @IsInt()
  projectId: number;

  @IsOptional()
  @IsInt()
  stepId?: number;

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

  @IsInt()
  routedToTeamId: number;

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
  @IsInt()
  routedToTeamId: number;
}
