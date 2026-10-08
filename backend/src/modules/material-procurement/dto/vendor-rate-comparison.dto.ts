import {
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class SaveVendorRateComparisonDto {
  @IsString() @MinLength(1) @MaxLength(255) title: string;
  @IsUUID() project_id: string;
  @IsUUID() boq_id: string;
  @IsOptional() @IsString() @MaxLength(10000) notes?: string;
  @IsObject() snapshot: Record<string, any>;
  @IsOptional() @IsInt() @Min(1) revision?: number;
}
