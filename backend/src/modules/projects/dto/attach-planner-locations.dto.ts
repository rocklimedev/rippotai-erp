import { ArrayNotEmpty, ArrayUnique, IsArray, IsUUID } from 'class-validator';

export class AttachPlannerLocationsDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  location_ids: string[];
}
