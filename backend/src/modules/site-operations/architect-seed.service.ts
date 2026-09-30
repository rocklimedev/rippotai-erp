import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ArchitectVisitStage } from './models/architect-visit-stage.model';
import { QualityCheckHead } from './models/quality-check-head.model';
import { ARCHITECT_VISIT_STAGES } from './constants/architect-visit-stages.constant';
import { QUALITY_CHECK_HEADS } from './constants/quality-check-heads.constant';

/**
 * Seeds master data from the two source workbooks on first boot (only if empty):
 *
 * 1. ARCHITECT SITEVISIT SCHEDULE.xlsx → "Architect visit schedule"
 *    → architect_visit_stages
 *
 * 2. ARCHITECT SITEVISIT SCHEDULE.xlsx → "Quality check list"
 *    (+ QUALITY CHECK LIST.xlsx → "QC -Work heads")
 *    → quality_check_heads
 *
 * Detailed per-work-head checkpoints live in constants/work-head-checkpoints.constant.ts
 * and are applied per-project via QualityChecklistService.createFromWorkHead().
 */
@Injectable()
export class ArchitectSeedService implements OnModuleInit {
  private readonly logger = new Logger(ArchitectSeedService.name);

  constructor(
    @InjectModel(ArchitectVisitStage)
    private readonly stages: typeof ArchitectVisitStage,
    @InjectModel(QualityCheckHead)
    private readonly heads: typeof QualityCheckHead,
  ) {}

  async onModuleInit() {
    try {
      if ((await this.stages.count()) === 0) {
        await this.stages.bulkCreate(
          ARCHITECT_VISIT_STAGES.map(
            ({ visit_no, stage, checks_purpose, visit_type, remarks }) => ({
              visit_no,
              stage,
              checks_purpose,
              visit_type,
              remarks: remarks ?? null,
              is_active: true,
            }),
          ) as any,
        );
        this.logger.log(
          `Seeded ${ARCHITECT_VISIT_STAGES.length} architect visit stages`,
        );
      }

      if ((await this.heads.count()) === 0) {
        await this.heads.bulkCreate(
          QUALITY_CHECK_HEADS.map(({ sort_order, name }) => ({
            sort_order,
            name,
            is_active: true,
          })) as any,
        );
        this.logger.log(
          `Seeded ${QUALITY_CHECK_HEADS.length} quality check heads`,
        );
      }
    } catch (e) {
      this.logger.error(
        'Seeding failed (are the tables created / migrations run?)',
        e as any,
      );
    }
  }
}
