import { IsString, IsNumber, IsOptional, Min, IsNotEmpty } from 'class-validator';

export class CreateMaterialEstimateDto {
  @IsString() @IsNotEmpty()
  materialRequirementId: string;

  @IsOptional() @IsString()
  rateSheetId?: string;

  @IsNumber() @Min(0.001)
  quantity: number;

  @IsString() @IsNotEmpty()
  unit: string;

  @IsNumber() @Min(0)
  unitRate: number;
}
