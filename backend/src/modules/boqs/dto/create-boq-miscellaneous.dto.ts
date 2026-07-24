// dto/create-boq-miscellaneous.dto.ts
import { IsString, IsNumber, IsOptional, IsInt } from 'class-validator';

export class CreateBoqMiscellaneousDto {
  @IsString()
  name: string;

  @IsNumber()
  value: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsInt()
  sort_order?: number;
}
