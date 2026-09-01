import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class TickConditionDto {
  @IsBoolean()
  ticked: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  remarks?: string;
}
