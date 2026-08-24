import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  IsNotEmpty,
  IsDateString,
} from 'class-validator';

export class CreateMaterialRateSheetDto {
  @IsString() @IsNotEmpty()
  materialRequirementId: string;

  @IsString() @IsNotEmpty()
  vendorName: string;

  @IsString() @IsNotEmpty()
  unit: string;

  @IsNumber() @Min(0)
  unitRate: number;

  @IsOptional() @IsString()
  currency?: string;

  @IsOptional() @IsDateString()
  validTill?: string;
}
