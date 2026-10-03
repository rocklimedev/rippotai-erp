import {
  IsUUID,
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsNumber,
  IsDate,
  IsArray,
  ValidateNested,
  ArrayNotEmpty,
  MaxLength,
  Min,
  Max,
  IsNotEmpty,
  IsInt,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { WorkHead } from '@/common/enums/quality-checklist.enums';
import { ChecklistStatus } from '../models/quality-checklist.model';
import {
  ItemStatus,
  CheckpointPhase,
} from '../models/quality-checklist-item.model';

/**
 * DTO for creating a new Quality Checklist Item
 */
export class CreateQualityChecklistItemDto {
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  serial_number: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  checkpoint_name: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  checkpoint_description?: string;

  @IsEnum(CheckpointPhase)
  @IsNotEmpty()
  phase: CheckpointPhase;

  @IsEnum(ItemStatus)
  @IsOptional()
  status?: ItemStatus = ItemStatus.NOT_STARTED;

  @IsBoolean()
  @IsOptional()
  is_accepted?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  remarks?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  inspection_date?: Date;

  @IsUUID()
  @IsOptional()
  inspected_by?: string;
}

/**
 * DTO for updating a Quality Checklist Item
 */
export class UpdateQualityChecklistItemDto {
  @IsEnum(ItemStatus)
  @IsOptional()
  status?: ItemStatus;

  @IsBoolean()
  @IsOptional()
  is_accepted?: boolean | null;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  remarks?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  inspection_date?: Date | null;

  @IsUUID()
  @IsOptional()
  inspected_by?: string;
}

/**
 * DTO for creating a new Quality Checklist
 */
export class CreateQualityChecklistDto {
  @IsOptional()
  @IsEnum(WorkHead)
  work_head?: WorkHead;
  @IsUUID()
  @IsNotEmpty()
  project_id: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  checklist_name: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsEnum(ChecklistStatus)
  @IsOptional()
  status?: ChecklistStatus = ChecklistStatus.PENDING;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQualityChecklistItemDto)
  @IsOptional()
  checklist_items?: CreateQualityChecklistItemDto[];
}

/**
 * DTO for updating a Quality Checklist
 */
export class UpdateQualityChecklistDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  checklist_name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsEnum(ChecklistStatus)
  @IsOptional()
  status?: ChecklistStatus;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  completion_percentage?: number;
}

export class CreateQualityChecklistFromTemplateDto {
  @IsUUID() project_id: string;
  @IsEnum(WorkHead) work_head: WorkHead;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
}

/**
 * DTO for bulk updating checklist items
 */
export class BulkUpdateChecklistItemsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateChecklistItemWithIdDto)
  @ArrayNotEmpty()
  items: UpdateChecklistItemWithIdDto[];
}

/**
 * DTO for updating checklist item with ID
 */
export class UpdateChecklistItemWithIdDto extends UpdateQualityChecklistItemDto {
  @IsUUID()
  @IsNotEmpty()
  id: string;
}

/**
 * DTO for response - Quality Checklist Item
 */
export class QualityChecklistItemResponseDto {
  id: string;
  checklist_id: string;
  serial_number: number;
  checkpoint_name: string;
  checkpoint_description: string | null;
  phase: CheckpointPhase;
  status: ItemStatus;
  is_accepted: boolean | null;
  remarks: string | null;
  inspection_date: Date | null;
  inspected_by: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * DTO for response - Quality Checklist with items
 */
export class QualityChecklistResponseDto {
  id: string;
  project_id: string;
  checklist_name: string;
  description: string | null;
  status: ChecklistStatus;
  completion_percentage: number;
  created_by: string | null;
  updated_by: string | null;
  created_at: Date;
  updated_at: Date;
  checklist_items?: QualityChecklistItemResponseDto[];
}

/**
 * DTO for paginated response
 */
export class PaginatedQualityChecklistDto {
  data: QualityChecklistResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * DTO for checklist summary/statistics
 */
export class ChecklistSummaryDto {
  total_items: number;
  accepted_items: number;
  rejected_items: number;
  pending_items: number;
  in_progress_items: number;
  completion_percentage: number;
  acceptance_percentage: number;
}

/**
 * DTO for filtering checklists
 */
export class FilterQualityChecklistDto {
  @IsUUID()
  @IsOptional()
  project_id?: string;

  @IsEnum(ChecklistStatus)
  @IsOptional()
  status?: ChecklistStatus;

  @IsString()
  @IsOptional()
  search?: string;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(1)
  page?: number = 1;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsString()
  @IsOptional()
  sortBy?: string = 'created_at';

  @IsEnum({ ASC: 'ASC', DESC: 'DESC' })
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

/**
 * DTO for filtering checklist items
 */
export class FilterChecklistItemDto {
  @IsUUID()
  @IsOptional()
  checklist_id?: string;

  @IsEnum(ItemStatus)
  @IsOptional()
  status?: ItemStatus;

  @IsEnum(CheckpointPhase)
  @IsOptional()
  phase?: CheckpointPhase;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  is_accepted?: boolean;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(1)
  page?: number = 1;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsEnum({ ASC: 'ASC', DESC: 'DESC' })
  @IsOptional()
  sortBy?: string = 'serial_number';

  @IsString()
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC' = 'ASC';
}
