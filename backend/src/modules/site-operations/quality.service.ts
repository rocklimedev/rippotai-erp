import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { fn, col } from 'sequelize';
import { QualityCheckHead } from './models/quality-check-head.model';
import { ProjectQualityCheck } from './models/project-quality-check.model';
import { QualityCheckStatus } from '@/common/enums/architect-visit.enums';
import {
  CreateQualityItemDto,
  QueryQualityCheckDto,
  UpdateQualityItemDto,
  UpsertQualityCheckDto,
} from './dto/quality.dto';

/**
 * Simple project-level quality check heads (the one-row-per-head list from
 * ARCHITECT SITEVISIT SCHEDULE.xlsx → "Quality check list").
 *
 * Master: quality_check_heads
 * Per-project results: project_quality_checks
 *
 * For detailed Before/During/After checkpoints see QualityChecklistService
 * + WORK_HEAD_CHECKPOINTS constant.
 */
@Injectable()
export class QualityService {
  constructor(
    @InjectModel(QualityCheckHead)
    private readonly items: typeof QualityCheckHead,
    @InjectModel(ProjectQualityCheck)
    private readonly checks: typeof ProjectQualityCheck,
  ) {}

  // ---------- Master ----------
  listItems(includeInactive = false) {
    return this.items.findAll({
      where: includeInactive ? {} : { is_active: true },
      order: [['sort_order', 'ASC']],
    });
  }

  async createItem(dto: CreateQualityItemDto) {
    const max = ((await this.items.max('sort_order')) as number | null) ?? 0;
    return this.items.create({
      ...dto,
      sort_order: dto.sort_order ?? max + 1,
      is_active: dto.is_active ?? true,
    } as any);
  }

  async updateItem(id: string, dto: UpdateQualityItemDto) {
    const row = await this.items.findByPk(id);
    if (!row) throw new NotFoundException('Checklist item not found');
    return row.update(dto as any);
  }

  async deactivateItem(id: string) {
    await this.updateItem(id, { is_active: false });
    return { message: 'Checklist item deactivated' };
  }

  // ---------- Per project ----------
  /** Full checklist for a project: every active head merged with its result (Pending if not yet checked). */
  async projectChecklist(q: QueryQualityCheckDto) {
    const [items, results] = await Promise.all([
      this.listItems(),
      this.checks.findAll({ where: { project_id: q.project_id } }),
    ]);
    const byItem = new Map(results.map((r) => [r.item_id, r]));
    let list = items.map((item) => {
      const r = byItem.get(item.id);
      return {
        item_id: item.id,
        name: item.name,
        work_head: item.work_head,
        template_serial_number: item.template_serial_number,
        sort_order: item.sort_order,
        check_id: r?.id ?? null,
        status: r?.status ?? QualityCheckStatus.PENDING,
        remarks: r?.remarks ?? null,
        checked_by: r?.checked_by ?? null,
        checked_at: r?.checked_at ?? null,
      };
    });
    if (q.status) list = list.filter((l) => l.status === q.status);
    return list;
  }

  async upsertCheck(dto: UpsertQualityCheckDto, userId?: string) {
    const item = await this.items.findByPk(dto.item_id);
    if (!item) throw new NotFoundException('Checklist item not found');
    const payload = {
      status: dto.status,
      remarks: dto.remarks ?? null,
      checked_by:
        dto.status === QualityCheckStatus.PENDING ? null : (userId ?? null),
      checked_at: dto.status === QualityCheckStatus.PENDING ? null : new Date(),
    };
    const existing = await this.checks.findOne({
      where: { project_id: dto.project_id, item_id: dto.item_id },
    });
    if (existing) return existing.update(payload);
    return this.checks.create({
      project_id: dto.project_id,
      item_id: dto.item_id,
      ...payload,
    } as any);
  }

  async summary(projectId: string) {
    const rows: any[] = await this.checks.findAll({
      where: { project_id: projectId },
      attributes: ['status', [fn('COUNT', col('id')), 'count']],
      group: ['status'],
      raw: true,
    });
    const total = await this.items.count({ where: { is_active: true } });
    const recorded = rows.reduce((s, r) => s + Number(r.count), 0);
    return {
      total_items: total,
      not_yet_checked: Math.max(total - recorded, 0),
      by_status: rows,
    };
  }
}
