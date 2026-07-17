import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsInt,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class LayoutItemDto {
  @IsString()
  key: string;

  @IsInt()
  @Min(0)
  x: number;

  @IsInt()
  @Min(0)
  y: number;

  @IsInt()
  @Min(1)
  w: number;

  @IsInt()
  @Min(1)
  h: number;
}

export class SaveDashboardDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LayoutItemDto)
  layout: LayoutItemDto[];

  @IsArray()
  @IsString({ each: true })
  @ArrayUnique()
  hidden_keys: string[];
}
