import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
export class ProposalDto {
  @Type(() => Number)
  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  timeline?: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsString()
  author?: string;
}
