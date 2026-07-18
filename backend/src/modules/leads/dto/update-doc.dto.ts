import { IsIn, IsInt } from 'class-validator';

export class UpdateDocDto {
  // 0 = Not started, 1 = Sent, 2 = Signed. If omitted, the service cycles to the next status.
  @IsInt()
  @IsIn([0, 1, 2])
  status?: number;
}
