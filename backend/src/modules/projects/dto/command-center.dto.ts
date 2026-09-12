import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

import {
  PhaseRollupState,
  ProjectHealth,
} from '@/common/enums/command-center.enum';

// ============================================================
// QUERY / REQUEST DTOs
// ============================================================

export enum HealthFilter {
  ALL = 'all',
  PROGRESS = 'progress',
  GATE = 'gate',
  DANGER = 'danger',
  COMPLETE = 'complete',
}

export class PortfolioQueryDto {
  @ApiPropertyOptional({
    enum: HealthFilter,
  })
  @IsOptional()
  @IsEnum(HealthFilter)
  health?: HealthFilter;

  @ApiPropertyOptional({
    example: 'Nagpal Residence',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;
}

export class ActivityQueryDto {
  @ApiPropertyOptional({
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'e.g. "Document", "Project", "TaskExecution"',
  })
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  entityId?: string;
}

export class UploadDocumentDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  documentTypeId: string;

  @ApiPropertyOptional({
    example: 'Approved Floor Plan',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({
    example: 'Uploaded after client approval',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  remarks?: string;
}

export class ReviewDocumentDto {
  @ApiProperty({
    enum: ['approved', 'rejected'],
  })
  @IsIn(['approved', 'rejected'])
  status: 'approved' | 'rejected';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  remarks?: string;
}

export class ApproveGateDto {
  @ApiPropertyOptional({
    example: 'Approved after final review',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  remarks?: string;

  /**
   * Approve even though mandatory conditions aren't all met.
   * Admin-only and always logged.
   */
  @ApiPropertyOptional({
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  override?: boolean = false;
}

export class CompleteTaskDto {
  @ApiProperty({
    enum: ['DONE', 'FAILED'],
  })
  @IsIn(['DONE', 'FAILED'])
  status: 'DONE' | 'FAILED';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  remarks?: string;
}

// ============================================================
// RESPONSE DTOs
// ============================================================

export class PhaseGateResponseDto {
  @ApiProperty({
    nullable: true,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string | null;

  @ApiProperty({
    nullable: true,
    example: 'GATE-01',
  })
  code: string | null;

  @ApiProperty({
    nullable: true,
    example: 'Design Approval',
  })
  name: string | null;
}

export class ProjectPhaseRollupResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    example: 'PHASE-01',
  })
  code: string;

  @ApiProperty({
    example: 1,
  })
  phaseNumber: number;

  @ApiProperty({
    example: 'Planning & Strategy',
  })
  name: string;

  @ApiProperty({
    type: () => PhaseGateResponseDto,
  })
  gate: PhaseGateResponseDto;

  @ApiProperty({
    example: 3,
  })
  docsDone: number;

  @ApiProperty({
    example: 5,
  })
  docsTotal: number;

  @ApiProperty({
    example: 4,
  })
  tasksDone: number;

  @ApiProperty({
    example: 6,
  })
  tasksTotal: number;

  @ApiProperty({
    example: 64,
    minimum: 0,
    maximum: 100,
  })
  pct: number;

  @ApiProperty({
    enum: PhaseRollupState,
  })
  state: PhaseRollupState;

  @ApiProperty({
    example: false,
  })
  gateApproved: boolean;

  @ApiProperty({
    nullable: true,
    example: 'user-uuid',
  })
  gateApprovedBy: string | null;
}

export class ProjectHealthResponseDto {
  @ApiProperty({
    enum: ProjectHealth,
  })
  key: ProjectHealth;

  @ApiProperty({
    example: 'On Track',
  })
  label: string;
}

export class PortfolioProjectResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    example: 'NAGPAL-RESIDENCE',
  })
  code: string;

  @ApiProperty({
    example: 'Nagpal Residence',
  })
  name: string;

  @ApiProperty({
    example: 'Green Park Main, New Delhi',
  })
  location: string;

  @ApiProperty({
    example: 3,
  })
  currentPhaseSeq: number;

  @ApiProperty({
    type: () => [ProjectPhaseRollupResponseDto],
  })
  phases: ProjectPhaseRollupResponseDto[];

  @ApiProperty({
    example: 48,
    minimum: 0,
    maximum: 100,
  })
  pct: number;

  @ApiProperty({
    type: () => ProjectHealthResponseDto,
  })
  health: ProjectHealthResponseDto;

  @ApiProperty({
    nullable: true,
    example: 2,
  })
  daysIdle: number | null;

  @ApiProperty({
    nullable: true,
    type: String,
    format: 'date-time',
    example: '2026-09-11T10:30:00.000Z',
  })
  lastActivity: Date | null;
}

/**
 * Currently GET /projects/:projectId/phases
 * returns the exact same project rollup structure.
 */
export class ProjectPhasesResponseDto extends PortfolioProjectResponseDto {}

/**
 * Optional wrapper response.
 *
 * Use this only if you later change GET /portfolio to return:
 *
 * {
 *   projects: [...],
 *   total: 10
 * }
 *
 * Your current service returns PortfolioProjectResponseDto[] directly,
 * so this DTO is NOT currently required by getPortfolio().
 */
export class PortfolioResponseDto {
  @ApiProperty({
    type: () => [PortfolioProjectResponseDto],
  })
  projects: PortfolioProjectResponseDto[];

  @ApiProperty({
    example: 10,
  })
  total: number;
}
