import { IsArray, IsString, IsUUID } from 'class-validator';

export class ReorderItemsDto {
  @IsUUID()
  category_id: string;

  @IsArray()
  @IsString({ each: true })
  ordered_ids: string[];
}
