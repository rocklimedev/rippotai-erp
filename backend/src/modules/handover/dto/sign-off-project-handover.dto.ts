import { IsString, MaxLength } from 'class-validator';

export class SignOffProjectHandoverDto {
  @IsString()
  @MaxLength(255)
  clientSignedOffBy: string;
}
