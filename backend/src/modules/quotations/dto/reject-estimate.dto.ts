import { IsOptional, IsString } from 'class-validator';

export class RejectEstimateDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
