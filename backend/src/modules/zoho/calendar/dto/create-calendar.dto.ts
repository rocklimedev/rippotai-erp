import {
  IsBoolean,
  IsHexColor,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateZohoCalendarDto {
  @IsString()
  @MaxLength(50)
  name: string;

  @IsHexColor()
  color: string;

  @IsOptional()
  @IsString()
  textcolor?: string;

  @IsOptional()
  @IsBoolean()
  include_infreebusy?: boolean;

  @IsOptional()
  @IsIn(['enable', 'disable'])
  private?: 'enable' | 'disable';

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsIn(['disable', 'freebusy', 'view'])
  public?: 'disable' | 'freebusy' | 'view';
}
