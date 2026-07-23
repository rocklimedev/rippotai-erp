import {
  IsEnum,
  IsOptional,
  IsString,
  IsNumber,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { BoqStatus } from '@/common/enums/boq-enums';

export class UpdateBoqDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsEnum(BoqStatus)
  status?: BoqStatus;

  @IsOptional()
  @IsString()
  @MaxLength(20000)
  terms_html?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  misc_pct?: number;
}
