import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateProjectPhaseDto {
  @IsInt()
  @Min(1)
  phase_number: number;

  @IsString()
  phase_code: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sort_order?: number;
}
