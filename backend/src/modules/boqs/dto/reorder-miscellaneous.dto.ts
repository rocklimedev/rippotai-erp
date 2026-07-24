import { IsArray, IsString } from 'class-validator';

export class ReorderMiscellaneousDto {
  @IsArray()
  @IsString({ each: true })
  ordered_ids: string[];
}
