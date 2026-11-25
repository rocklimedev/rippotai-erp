import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class ClearGateDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  remarks?: string;

  /** Only honoured if the gate's own allowsOverride flag is true AND the
   *  caller holds the gates:override permission — enforced by the controller. */
  @IsOptional()
  @IsBoolean()
  override?: boolean;

  /** Direct clear from the phase's "Clear gate" button (confirmed twice in the UI).
   *  Needs only gates:clear; unmet conditions are recorded as an override. */
  @IsOptional()
  @IsBoolean()
  direct?: boolean;
}
