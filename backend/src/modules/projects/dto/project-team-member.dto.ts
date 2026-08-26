import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class AddProjectTeamMemberDto {
  @IsUUID()
  user_id: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  role_label: string;

  @IsOptional()
  @IsBoolean()
  is_primary?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  sort_order?: number;
}
