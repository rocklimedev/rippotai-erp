import { IsOptional, IsString } from 'class-validator';

export class UpdateLineupStatusDto {
  @IsOptional()
  @IsString()
  notes?: string;
}
