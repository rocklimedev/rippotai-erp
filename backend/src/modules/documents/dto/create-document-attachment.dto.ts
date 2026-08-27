import { IsOptional, IsString } from 'class-validator';

export class CreateDocumentAttachmentDto {
  @IsOptional()
  @IsString()
  remark?: string;
}
