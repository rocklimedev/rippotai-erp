import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { BoqStatus } from '@/common/enums/boq-enums';

export class UpdateBoqDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsEnum(BoqStatus)
  status?: BoqStatus;
}
