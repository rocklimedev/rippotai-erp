import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { SampleBoardStatus } from '../models/sample-board.model';

export class CreateSampleBoardDto {
  @IsUUID()
  @IsOptional()
  material_requirement_id?: string;

  @IsUUID()
  project_id: string;

  @IsString()
  title: string;

  @IsUUID()
  @IsOptional()
  vendor_id?: string;

  @IsUUID()
  @IsOptional()
  document_id?: string;

  @IsEnum(SampleBoardStatus)
  @IsOptional()
  status?: SampleBoardStatus;

  @IsUUID()
  @IsOptional()
  created_by?: string;
}

export class UpdateSampleBoardDto extends PartialType(CreateSampleBoardDto) {}
