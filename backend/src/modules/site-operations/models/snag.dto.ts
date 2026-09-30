import { PartialType, OmitType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { SnagStatus } from '@/common/enums/architect-visit.enums';

export class CreateSnagDto {
  @IsUUID() project_id: string;
  @IsOptional() @IsUUID() visit_id?: string;
  @IsOptional() @IsString() @MaxLength(100) floor?: string;
  @IsOptional() @IsString() @MaxLength(150) room?: string;
  @IsOptional() @IsString() @MaxLength(150) category?: string;
  @IsString() observation: string;
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  photos?: string[];
  @IsOptional() @IsString() @MaxLength(150) scope?: string;
  @IsOptional() @IsEnum(SnagStatus) status?: SnagStatus;
  @IsOptional() @IsString() remarks?: string;
}

export class UpdateSnagDto extends PartialType(
  OmitType(CreateSnagDto, ['project_id'] as const),
) {}

export class QuerySnagDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(500) limit?: number =
    50;
  @IsOptional() @IsUUID() project_id?: string;
  @IsOptional() @IsUUID() visit_id?: string;
  @IsOptional() @IsEnum(SnagStatus) status?: SnagStatus;
  @IsOptional() @IsString() floor?: string;
  @IsOptional() @IsString() room?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() scope?: string;
  @IsOptional() @IsString() @MaxLength(100) search?: string;
}
