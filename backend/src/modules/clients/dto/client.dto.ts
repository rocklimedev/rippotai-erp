import { IsString, IsOptional, IsEmail, MaxLength } from 'class-validator';

export class CreateClientDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsString()
  @MaxLength(255)
  slug: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  contact_person?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;
}

export class UpdateClientDto extends CreateClientDto {}
