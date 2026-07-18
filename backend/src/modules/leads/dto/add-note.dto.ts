import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AddNoteDto {
  @IsString()
  @IsNotEmpty()
  text: string;

  @IsOptional()
  @IsString()
  author?: string;
}
