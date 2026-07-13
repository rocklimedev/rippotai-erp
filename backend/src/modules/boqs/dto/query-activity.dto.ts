import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class QueryActivityDto {
  @IsOptional()
  @IsString()
  user?: string;

  @IsOptional()
  @IsUUID()
  user_id?: string;

  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsDateString()
  date_from?: string;

  @IsOptional()
  @IsDateString()
  date_to?: string;

  @IsOptional()
  @IsUUID()
  boq_id?: string;
}
