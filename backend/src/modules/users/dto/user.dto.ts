import { PartialType, OmitType } from '@nestjs/mapped-types';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  // ✅ FIXED: role_id instead of role
  @IsOptional()
  @IsString()
  @MaxLength(36)
  role_id?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsString()
  created_by?: string;
}

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password'] as const),
) {
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  // keep role_id editable in updates too
  @IsOptional()
  @IsString()
  role_id?: string;
}
