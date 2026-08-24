import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateScopeItemDto {
  // =========================================================
  // PARENT SCOPE OF WORK
  // =========================================================
  //
  // This is the UUID of the ScopeOfWork document.
  //

  @IsUUID()
  scopeOfWorkId: string;

  // =========================================================
  // ACTUAL SCOPE OF WORK ITEM
  // =========================================================
  //
  // Example:
  // "False ceiling with LED lighting"
  //

  @IsString()
  @IsNotEmpty()
  scopeOfWork: string;

  // =========================================================
  // PROJECT SPACE
  // =========================================================

  @IsUUID()
  projectSpaceId: string;

  // =========================================================
  // SCOPE CATEGORY
  // =========================================================

  @IsUUID()
  scopeCategoryId: string;

  // =========================================================
  // INCLUDED
  // =========================================================

  @IsOptional()
  @IsBoolean()
  isIncluded?: boolean;

  // =========================================================
  // EXCLUDED
  // =========================================================

  @IsOptional()
  @IsBoolean()
  isExcluded?: boolean;

  // =========================================================
  // NOTES
  // =========================================================

  @IsOptional()
  @IsString()
  notes?: string;

  // =========================================================
  // SORT ORDER
  // =========================================================

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
