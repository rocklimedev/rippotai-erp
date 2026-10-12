import { IsString, MaxLength, MinLength } from 'class-validator';
export class ReconcileReminderDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  remote_id: string;
}
