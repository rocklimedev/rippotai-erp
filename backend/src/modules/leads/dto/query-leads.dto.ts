import { IsEnum, IsOptional, IsString } from 'class-validator';
import { LeadStage } from '@/common/enums/leads.enums';

export enum ContactSort {
  NAME_ASC = 'name-asc',
  NAME_DESC = 'name-desc',
  STAGE = 'stage',
  DAYS = 'days',
  OWNER = 'owner',
  LOCATION = 'location',
}

export class QueryLeadsDto {
  @IsOptional()
  @IsString()
  q?: string; // free-text search: name, location, phone, email, owner

  @IsOptional()
  @IsEnum(LeadStage)
  stage?: LeadStage;

  @IsOptional()
  @IsEnum(ContactSort)
  sort?: ContactSort;
}
