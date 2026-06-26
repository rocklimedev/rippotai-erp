import { PartialType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePermissionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  resource: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  action: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdatePermissionDto extends PartialType(CreatePermissionDto) {}
