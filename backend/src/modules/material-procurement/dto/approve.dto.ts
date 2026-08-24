import { IsString, IsNotEmpty } from 'class-validator';

/** Generic approval payload shared by sample boards, rate sheets and estimates. */
export class ApproveDto {
  @IsString() @IsNotEmpty()
  approvedBy: string;
}

export class RejectDto {
  @IsString() @IsNotEmpty()
  approvedBy: string;

  @IsString()
  reason?: string;
}
