import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateProjectFloorDto {
  @IsInt()
  @Min(0)
  floor_number: number;

  @IsString()
  floor_name: string;

  @IsInt()
  @IsOptional()
  sort_order?: number;
}

export class UpdateProjectFloorDto {
  @IsInt()
  @Min(0)
  @IsOptional()
  floor_number?: number;

  @IsString()
  @IsOptional()
  floor_name?: string;

  @IsInt()
  @IsOptional()
  sort_order?: number;
}
