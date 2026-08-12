import { IsUUID, IsString, IsOptional, IsInt, Min } from 'class-validator';

export class CreateQcChecklistItemDto {
  @IsUUID()
  checklistId: string;

  @IsString()
  itemText: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
