import { IsEnum, IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { LeadType } from '@/common/enums/leads.enums';

export class CreateLeadDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsOptional()
  @IsString()
  whatsapp?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsEnum(LeadType)
  type?: LeadType;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  size?: string;

  @IsOptional()
  @IsString()
  budget?: string;

  @IsOptional()
  @IsString()
  timeline?: string;

  @IsOptional()
  @IsString()
  source?: string;
}
