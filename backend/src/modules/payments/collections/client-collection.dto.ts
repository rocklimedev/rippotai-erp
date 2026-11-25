import {
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export const COLLECTION_TYPES = ['TOKEN', 'PROJECT_PAYMENT'] as const;
export type CollectionType = (typeof COLLECTION_TYPES)[number];

export class CreateClientCollectionDto {
  @IsUUID()
  project_id: string;

  @IsIn(COLLECTION_TYPES)
  type: CollectionType;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount: number;

  @IsDateString()
  received_on: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}
