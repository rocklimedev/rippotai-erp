import { IsUUID, IsOptional, IsString, IsBoolean } from 'class-validator';

export class CreateUserSignatureDto {
  @IsUUID()
  user_id: string;

  @IsOptional()
  @IsString()
  signature_url?: string;

  @IsOptional()
  @IsString()
  signature_file_name?: string;

  @IsOptional()
  @IsString()
  signature_file_type?: string;

  @IsOptional()
  signature_file_size?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsUUID()
  created_by?: string;
}
