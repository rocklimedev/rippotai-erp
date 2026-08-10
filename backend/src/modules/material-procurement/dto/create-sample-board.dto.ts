import { IsString, IsOptional, IsArray, IsNotEmpty } from 'class-validator';

export class CreateSampleBoardDto {
  @IsString() @IsNotEmpty()
  materialRequirementId: string;

  @IsString() @IsNotEmpty()
  title: string;

  @IsOptional() @IsArray()
  imageUrls?: string[];

  @IsOptional() @IsString()
  vendorName?: string;

  @IsOptional() @IsString()
  notes?: string;
}
