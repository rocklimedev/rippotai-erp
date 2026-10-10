import { RequirePermission } from '@/common/decorator/require-permission.decorator';
import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { QueryTypes, Sequelize } from 'sequelize';

import { JwtAuthGuard } from '@/common/guards/jwt-auth-guard';

/**
 * Read-only rollups the project workspace shows next to the project record.
 * The UI called these (legacy /api/projects/:id/...) but no backend route
 * existed, so the panels silently stayed empty.
 */
@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectOverviewController {
  constructor(@InjectConnection() private readonly sequelize: Sequelize) {}

  private q<T extends object = Record<string, any>>(sql: string, projectId: string) {
    return this.sequelize.query<T>(sql, {
      replacements: { projectId },
      type: QueryTypes.SELECT,
    });
  }

  /** Approved BOQ value vs committed cost (POs + work orders). */
  @RequirePermission('projects:read')
  @Get(':id/financial')
  async financial(@Param('id', ParseUUIDPipe) projectId: string) {
    const [boq] = await this.q<{ approved: string | null; latest: string | null }>(
      `SELECT
         (SELECT total_value FROM boqs WHERE project_id = :projectId AND deleted_at IS NULL AND status = 'approved' ORDER BY updated_at DESC LIMIT 1) AS approved,
         (SELECT total_value FROM boqs WHERE project_id = :projectId AND deleted_at IS NULL AND status <> 'archived' ORDER BY updated_at DESC LIMIT 1) AS latest`,
      projectId,
    );
    const [po] = await this.q<{ total: string | null }>(
      `SELECT COALESCE(SUM(total_amount),0) AS total FROM purchase_orders
        WHERE project_id = :projectId AND UPPER(status) NOT IN ('DRAFT','CANCELLED')`,
      projectId,
    );
    const [wo] = await this.q<{ total: string | null }>(
      `SELECT COALESCE(SUM(total_amount),0) AS total FROM work_orders
        WHERE project_id = :projectId AND UPPER(COALESCE(status,'')) NOT IN ('DRAFT','CANCELLED')`,
      projectId,
    );
    const approved = Number(boq?.approved ?? boq?.latest ?? 0) || 0;
    const committed = (Number(po?.total) || 0) + (Number(wo?.total) || 0);
    const projected = Math.max(approved, committed);
    return {
      approved_boq_estimate: approved,
      committed_cost: committed,
      projected_final_cost: projected,
      cost_variation_pct: approved
        ? Math.round(((projected - approved) / approved) * 1000) / 10
        : null,
    };
  }

  /** Vendors engaged through POs / work orders, plus procurement-tracker vendors. */
  @RequirePermission('projects:read')
  @Get(':id/vendors')
  async vendors(@Param('id', ParseUUIDPipe) projectId: string) {
    const engaged = await this.q(
      `SELECT v.id, v.name, SUM(x.amount) AS committed, COUNT(*) AS orders
         FROM (
           SELECT vendor_id, total_amount AS amount FROM purchase_orders
            WHERE project_id = :projectId AND UPPER(status) <> 'CANCELLED'
           UNION ALL
           SELECT vendor_id, total_amount FROM work_orders
            WHERE project_id = :projectId AND UPPER(COALESCE(status,'')) <> 'CANCELLED'
         ) x JOIN vendors v ON v.id = x.vendor_id
        GROUP BY v.id, v.name ORDER BY committed DESC`,
      projectId,
    );
    const attached = await this.q(
      `SELECT id, vendor_name AS name FROM project_vendor_procurements
        WHERE project_id = :projectId AND deleted_at IS NULL AND vendor_name IS NOT NULL AND vendor_name <> ''`,
      projectId,
    );
    return { engaged, attached };
  }

  /** Delayed tasks and records waiting on an internal approval. */
  @RequirePermission('projects:read')
  @Get(':id/pending-work')
  async pendingWork(@Param('id', ParseUUIDPipe) projectId: string) {
    const delayed = await this.q(
      `SELECT id, title, due_date FROM tasks
        WHERE project_id = :projectId AND due_date < CURDATE()
          AND LOWER(COALESCE(status,'')) NOT IN ('done','completed','cancelled')
        ORDER BY due_date LIMIT 20`,
      projectId,
    );
    const blocked = await this.q(
      `SELECT id, title, due_date FROM tasks
        WHERE project_id = :projectId AND LOWER(COALESCE(status,'')) = 'blocked' LIMIT 20`,
      projectId,
    );
    const docs = await this.q(
      `SELECT id, title, NULL AS due_date FROM documents
        WHERE project_id = :projectId AND LOWER(status) IN ('submitted','under_review','pending_approval')
        ORDER BY updated_at DESC LIMIT 20`,
      projectId,
    );
    const boqs = await this.q(
      `SELECT id, CONCAT('BOQ: ', title) AS title, NULL AS due_date FROM boqs
        WHERE project_id = :projectId AND deleted_at IS NULL AND status = 'pending_approval'`,
      projectId,
    );
    return {
      delayed,
      blocked,
      awaiting_approval: [...boqs, ...docs],
      awaiting_client: [],
    };
  }

  /** Activity log rows for this project (and records inside it). */
  @RequirePermission('projects:read')
  @Get(':id/activity')
  async activity(
    @Param('id', ParseUUIDPipe) projectId: string,
    @Query('limit') limit = '50',
  ) {
    const n = Math.min(Math.max(Number(limit) || 50, 1), 200);
    return this.sequelize.query(
      `SELECT * FROM activity_logs
        WHERE entity_id = :projectId
           OR JSON_UNQUOTE(JSON_EXTRACT(changes, '$.project_id')) = :projectId
           OR JSON_UNQUOTE(JSON_EXTRACT(changes, '$.projectId')) = :projectId
        ORDER BY created_at DESC LIMIT ${n}`,
      { replacements: { projectId }, type: QueryTypes.SELECT },
    );
  }
}

/** Counts shown on the /dashboard launcher tiles (Dashboard.jsx BADGE_MAP). */
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class AppBadgesController {
  constructor(@InjectConnection() private readonly sequelize: Sequelize) {}

  @RequirePermission('dashboard:read')
  @Get('app-badges')
  async appBadges() {
    const [row] = await this.sequelize.query<Record<string, string | number>>(
      `SELECT
         (SELECT COUNT(*) FROM boqs WHERE deleted_at IS NULL AND status = 'awaiting_approval') AS boq,
         (SELECT COUNT(*) FROM quotations WHERE status = 'submitted') AS quotations,
         (SELECT COUNT(*) FROM calendar_events WHERE DATE(starts_at) = CURDATE()) AS calendar`,
      { type: QueryTypes.SELECT },
    );
    return {
      boq: Number(row?.boq) || 0,
      quotations: Number(row?.quotations) || 0,
      calendar: Number(row?.calendar) || 0,
    };
  }
}
