import { IsArray, IsIn, IsOptional, IsString } from 'class-validator';

export const BULK_ITEM_OPS = ['delete', 'change_unit', 'hide', 'show'] as const;
export type BulkItemOp = (typeof BULK_ITEM_OPS)[number];

export class BulkUpdateItemsDto {
  @IsArray()
  @IsString({ each: true })
  ids: string[];

  @IsIn(BULK_ITEM_OPS)
  op: BulkItemOp;

  @IsOptional()
  value?: string;
}
