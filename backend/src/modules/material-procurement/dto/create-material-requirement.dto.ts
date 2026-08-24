import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  IsNotEmpty,
} from 'class-validator';

export class CreateMaterialRequirementDto {
  @IsString() @IsNotEmpty()
  projectId: string;

  @IsString() @IsNotEmpty()
  designerId: string;

  @IsString() @IsNotEmpty()
  itemName: string;

  @IsOptional() @IsString()
  category?: string;

  @IsString() @IsNotEmpty()
  selection: string;

  @IsOptional() @IsNumber() @Min(0)
  budgetAmount?: number;

  @IsOptional() @IsString()
  style?: string;

  @IsOptional() @IsString()
  functionalNeeds?: string;
}
