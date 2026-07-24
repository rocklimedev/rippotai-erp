import { IsInt, IsOptional, IsUUID } from 'class-validator';

export class ApplyTermsDto {
  @IsUUID()
  terms_template_id: string;

  // Pin to a specific historical version; omit to snapshot the
  // template's current/latest version at the time of application.
  @IsOptional()
  @IsInt()
  version?: number;
}
