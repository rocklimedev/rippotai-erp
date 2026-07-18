import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ProposalDto {
  @IsString()
  @IsNotEmpty()
  amount: string;

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
