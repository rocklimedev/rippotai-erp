import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { TermsScope } from '@/common/enums/terms.enums';
export class CreateTermsTemplateDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(TermsScope)
  scope: TermsScope;

  @IsString()
  @IsNotEmpty()
  content_html: string;

  @IsOptional()
  @IsBoolean()
  is_default?: boolean;
}
