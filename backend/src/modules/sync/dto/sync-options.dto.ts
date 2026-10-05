import {
  IsOptional,
  IsBoolean,
  IsNumber,
  IsString,
  Min,
  Max,
} from 'class-validator';

export class SyncOptionsDto {
  /**
   * Ignore timestamps and perform a full synchronization.
   */
  @IsOptional()
  @IsBoolean()
  force_full_sync?: boolean;

  /**
   * Only pull events from Zoho → Local.
   */
  @IsOptional()
  @IsBoolean()
  pull_only?: boolean;

  /**
   * Only push events from Local → Zoho.
   */
  @IsOptional()
  @IsBoolean()
  push_only?: boolean;

  /**
   * Number of records to process per batch.
   * Default: 50
   */
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  batch_size?: number;

  /**
   * Skip conflicting records.
   * Default: false.
   */
  @IsOptional()
  @IsBoolean()
  skip_conflicts?: boolean;

  /**
   * Synchronize only a specific entity.
   */
  @IsOptional()
  @IsString()
  entity_id?: string;

  /**
   * Retry records that previously failed synchronization.
   */
  @IsOptional()
  @IsBoolean()
  retry_failed?: boolean;
}

export class SyncQueryDto {
  /**
   * Filter synchronization records by status.
   */
  @IsOptional()
  @IsString()
  status?: 'pending' | 'synced' | 'failed';

  /**
   * Maximum number of records to return.
   */
  @IsOptional()
  @IsNumber()
  @Min(0)
  limit?: number;

  /**
   * Number of records to skip.
   */
  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number;
}
