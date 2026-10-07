import { Type, Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { SnagStatus } from '@/common/enums/architect-visit.enums';

export class SnagListRowDto {
  @IsOptional() @IsString() @MaxLength(100) floor?: string;
  @IsOptional() @IsString() @MaxLength(150) room?: string;
  @IsOptional() @IsString() @MaxLength(150) category?: string;
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  observation: string;
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsUrl(
    {
      protocols: ['http', 'https'],
      require_protocol: true,
      require_tld: false,
    },
    { each: true },
  )
  photos?: string[];
  @IsOptional() @IsString() @MaxLength(150) scope?: string;
  @IsEnum(SnagStatus) status: SnagStatus;
  @IsOptional() @IsString() @MaxLength(5000) remarks?: string;
}
export class CreateSnagListDto {
  @IsUUID() project_id: string;
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  document_date: string;
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => SnagListRowDto)
  items: SnagListRowDto[];
}
export class UpdateSnagListDto extends CreateSnagListDto {
  @IsInt() @Min(1) revision: number;
}
export class QuerySnagListDto {
  @IsOptional() @IsUUID() project_id?: string;
  @IsOptional() @IsString() @MaxLength(100) search?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit: number =
    20;
}
