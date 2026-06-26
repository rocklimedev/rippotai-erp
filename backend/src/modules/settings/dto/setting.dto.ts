import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateSettingDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  key: string;

  @IsObject()
  @IsNotEmpty()
  value: Record<string, any>;

  @IsOptional()
  @IsUUID()
  updated_by?: string;
}

export class UpdateSettingDto {
  @IsObject()
  @IsNotEmpty()
  value: Record<string, any>;

  @IsOptional()
  @IsUUID()
  updated_by?: string;
}
