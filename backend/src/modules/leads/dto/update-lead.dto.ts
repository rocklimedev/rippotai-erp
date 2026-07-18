import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import {
  LeadType,
  LeadTag,
  LeadColor,
  StuckMode,
} from '@/common/enums/leads.enums';

export class UpdateLeadDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() whatsapp?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsEnum(LeadType) type?: LeadType;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsString() size?: string;
  @IsOptional() @IsString() budget?: string;
  @IsOptional() @IsString() timeline?: string;
  @IsOptional() @IsString() source?: string;
  @IsOptional() @IsString() owner?: string;

  @IsOptional() @IsEnum(LeadTag) tag?: LeadTag | null;
  @IsOptional() @IsEnum(LeadColor) color?: LeadColor | null;
  @IsOptional() @IsEnum(StuckMode) stuckMode?: StuckMode;

  @IsOptional() @IsInt() @Min(0) days?: number;
}
