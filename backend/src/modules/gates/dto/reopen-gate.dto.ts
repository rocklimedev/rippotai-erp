import { IsString, MaxLength, MinLength } from 'class-validator';

export class ReopenGateDto {
  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  remarks: string;
}
