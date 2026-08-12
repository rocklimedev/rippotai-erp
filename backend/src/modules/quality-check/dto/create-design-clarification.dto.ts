import { IsUUID, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateDesignClarificationDto {
  @IsUUID()
  projectId: string;

  @IsOptional()
  @IsUUID()
  raisedBy?: string;

  @IsString()
  @MaxLength(255)
  subject: string;

  @IsString()
  question: string;
}
