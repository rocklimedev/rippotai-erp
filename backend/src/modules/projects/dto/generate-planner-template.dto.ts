import { IsOptional, IsUUID } from 'class-validator';

export class GeneratePlannerTemplateDto {
  @IsOptional()
  @IsUUID()
  user_id?: string;
}
