import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateShortlistPackageDto {
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsUUID()
  source_shortlist_id: string;
}

export class ApplyShortlistPackageDto {
  @IsUUID()
  target_shortlist_id: string;
}
