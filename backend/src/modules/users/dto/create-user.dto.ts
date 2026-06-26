import { IsEmail, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @MinLength(8)
  password: string;

  @IsString()
  role: string;

  @IsUUID()
  createdBy: string;
}
