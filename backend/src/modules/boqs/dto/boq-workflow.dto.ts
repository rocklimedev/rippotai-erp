import { IsOptional, IsString } from 'class-validator';

export class SubmitForApprovalDto {
  @IsOptional()
  @IsString()
  note?: string;
}

export class ApproveBoqDto {
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class DuplicateVersionDto {
  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
