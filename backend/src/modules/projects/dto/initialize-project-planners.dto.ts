import { IsOptional, IsUUID } from 'class-validator';

export class InitializeProjectPlannersDto {
  @IsOptional()
  @IsUUID()
  user_id?: string;
}
