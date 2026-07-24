import { PartialType, OmitType } from '@nestjs/mapped-types';
import { IsOptional, IsString } from 'class-validator';
import { CreateTermsTemplateDto } from './create-terms-template.dto';

// Renaming, rescoping, activating/deactivating, setting default — none
// of this touches wording, so it's a plain PATCH.
export class UpdateTermsTemplateDto extends PartialType(
  OmitType(CreateTermsTemplateDto, ['content_html'] as const),
) {}

// Changing the actual wording goes through TermsService.updateContent,
// which appends a new TermsTemplateVersion rather than mutating one in
// place — that's why it's a separate DTO/endpoint from the one above.
export class UpdateTermsTemplateContentDto {
  @IsString()
  content_html: string;

  @IsOptional()
  @IsString()
  change_note?: string;
}
