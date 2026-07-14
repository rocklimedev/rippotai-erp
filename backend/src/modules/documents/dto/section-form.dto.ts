import { Type } from 'class-transformer';
import {
  IsArray,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class SectionFormAttachmentDto {
  @IsString()
  filename: string;

  @IsOptional()
  @IsString()
  mime?: string;

  // Raw base64 payload (the frontend strips the `data:...;base64,` prefix
  // client-side before sending — see readFile() in SectionForm).
  @IsString()
  content_b64: string;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class SectionFormDto {
  @IsUUID()
  project_id: string;

  // { [sectionTitle]: { [fieldKey]: string } } — free-form, validated at
  // the field level isn't practical since the section list is UI-driven.
  @IsObject()
  sections: Record<string, Record<string, string>>;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SectionFormAttachmentDto)
  attachments?: SectionFormAttachmentDto[];
}
