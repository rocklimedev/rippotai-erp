import { IsBase64, IsOptional, IsString, MaxLength } from 'class-validator';

// Mirrors the 8 MB per-file cap enforced client-side in addFiles()
export const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024;

export class SiteRekiAttachmentDto {
  @IsString()
  @MaxLength(255)
  filename: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  mime?: string;

  // Frontend sends FileReader's dataURL content after the base64 `,` split
  @IsBase64()
  content_b64: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  remark?: string;
}
