import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { fn, col, Op } from 'sequelize';
import { Boq } from './models/boq.model';
import { BoqTemplate } from './models/boq-template.model';
import { BoqActivity } from './models/boq-activity.model';
import { Project } from '../projects/models/projects.model';
import { BoqActivityAction, BoqStatus } from '@/common/enums/boq-enums';

// A manual/Excel BOQ is assumed to take about this long to put
// together; getProductivity() uses it purely as a stated baseline for
// "hours saved", not a measured figure.
const MANUAL_BASELINE_MINUTES = 180;

interface MonthBucket {
  key: string; // '2026-02', used to match DATE_FORMAT(..., '%Y-%m') output
  label: string; // 'Feb', shown on the chart axis
  start: Date;
}

@Injectable()
export class BoqDashboardService {
  constructor(
    @InjectModel(Boq)
    private readonly boqModel: typeof Boq,
    @InjectModel(BoqTemplate)
    private readonly templateModel: typeof BoqTemplate,
    @InjectModel(BoqActivity)
    private readonly activityModel: typeof BoqActivity,
    @InjectModel(Project)
    private readonly projectModel: typeof Project,
  ) {}

  // ---------- Summary strip ----------

  async getSummary() {
    const [total, drafts, awaiting, approved, templates] = await Promise.all([
      this.boqModel.count(),
      this.boqModel.count({ where: { status: BoqStatus.DRAFT } }),
      this.boqModel.count({ where: { status: BoqStatus.AWAITING_APPROVAL } }),
      this.boqModel.count({ where: { status: BoqStatus.APPROVED } }),
      this.templateModel.count(),
    ]);

    return {
      total,
      drafts,
      awaiting_approval: awaiting,
      approved,
      templates,
    };
  }

  // ---------- Productivity ----------

  /**
   * "Creation time" = minutes between a BOQ's CREATED activity entry
   * and its first SUBMITTED entry — i.e. how long it took to go from
   * a blank draft to submission-ready. BOQs that were never submitted
   * are excluded; they're still in progress, not a productivity data
   * point yet. hours_saved compares that against MANUAL_BASELINE_MINUTES.
   */
  async getProductivity() {
    const rows = (await this.activityModel.findAll({
      attributes: ['boq_id', 'action', 'created_at'],
      where: {
        action: [BoqActivityAction.CREATED, BoqActivityAction.SUBMITTED],
        boq_id: { [Op.ne]: null },
      },
      order: [['created_at', 'ASC']],
      raw: true,
    })) as unknown as Array<{
      boq_id: string;
      action: BoqActivityAction;
      created_at: Date;
    }>;

    const createdAtByBoq = new Map<string, Date>();
    const durationsMinutes: number[] = [];

    for (const row of rows) {
      if (row.action === BoqActivityAction.CREATED) {
        if (!createdAtByBoq.has(row.boq_id)) {
          createdAtByBoq.set(row.boq_id, row.created_at);
        }
        continue;
      }

      // SUBMITTED: only count the *first* submission per boq, then
      // stop tracking it so re-submissions after a "Returned" cycle
      // don't get counted again.
      const created = createdAtByBoq.get(row.boq_id);
      if (!created) continue;

      const minutes = (row.created_at.getTime() - created.getTime()) / 60000;
      if (minutes >= 0) durationsMinutes.push(minutes);
      createdAtByBoq.delete(row.boq_id);
    }

    const avgCreationTimeMinutes = durationsMinutes.length
      ? Math.round(
          durationsMinutes.reduce((sum, m) => sum + m, 0) /
            durationsMinutes.length,
        )
      : 0;

    const hoursSaved = durationsMinutes.length
      ? Math.round(
          (durationsMinutes.reduce(
            (sum, m) => sum + Math.max(0, MANUAL_BASELINE_MINUTES - m),
            0,
          ) /
            60) *
            10,
        ) / 10
      : 0;

    const monthlySeries = await this.monthlyCounts(6, 'created_at');

    return {
      avg_creation_time_minutes: avgCreationTimeMinutes,
      hours_saved: hoursSaved,
      monthly_series: monthlySeries.map((m) => ({
        month: m.label,
        count: m.count,
      })),
    };
  }

  // ---------- Project-wise table ----------

  async getProjectWise() {
    const totals = (await this.boqModel.findAll({
      attributes: [
        'project_id',
        [fn('COUNT', col('Boq.id')), 'boq_count'],
        [fn('COALESCE', fn('SUM', col('total_value')), 0), 'total_value'],
        [fn('MAX', col('version')), 'latest_version'],
      ],
      include: [{ model: Project, as: 'project', attributes: ['name'] }],
      group: ['project_id', 'project.id'],
      raw: true,
      nest: true,
    })) as unknown as Array<{
      project_id: string;
      boq_count: string;
      total_value: string;
      latest_version: number;
      project: { name: string } | null;
    }>;

    // Status shown per project is whichever of its BOQs was updated
    // most recently — a "what's happening now" signal rather than an
    // aggregate across every BOQ the project has ever had.
    const allBoqs = (await this.boqModel.findAll({
      attributes: ['project_id', 'status', 'updated_at'],
      order: [['updated_at', 'DESC']],
      raw: true,
    })) as unknown as Array<{
      project_id: string;
      status: BoqStatus;
      updated_at: Date;
    }>;

    const latestStatusByProject = new Map<string, BoqStatus>();
    for (const b of allBoqs) {
      if (!latestStatusByProject.has(b.project_id)) {
        latestStatusByProject.set(b.project_id, b.status);
      }
    }

    return totals
      .map((r) => ({
        project_id: r.project_id,
        project_name: r.project?.name ?? '—',
        boq_count: Number(r.boq_count),
        total_value: Number(r.total_value ?? 0),
        latest_version: Number(r.latest_version ?? 1),
        status: latestStatusByProject.get(r.project_id) ?? BoqStatus.DRAFT,
      }))
      .sort((a, b) => b.total_value - a.total_value);
  }

  // ---------- Charts ----------

  async getValueTrend(months = 6) {
    const buckets = this.monthBuckets(months);

    const rows = (await this.boqModel.findAll({
      attributes: [
        [fn('DATE_FORMAT', col('created_at'), '%Y-%m'), 'bucket'],
        [fn('COALESCE', fn('SUM', col('total_value')), 0), 'value'],
      ],
      where: { created_at: { [Op.gte]: buckets[0].start } },
      group: ['bucket'],
      raw: true,
    })) as unknown as Array<{ bucket: string; value: string }>;

    const byBucket = new Map(rows.map((r) => [r.bucket, Number(r.value)]));

    return buckets.map((b) => ({
      month: b.label,
      value: byBucket.get(b.key) ?? 0,
    }));
  }

  async getMonthlyVolume(months = 6) {
    const series = await this.monthlyCounts(months, 'created_at');
    return series.map((s) => ({ month: s.label, count: s.count }));
  }

  async getStatusMix() {
    const rows = (await this.boqModel.findAll({
      attributes: ['status', [fn('COUNT', col('id')), 'count']],
      group: ['status'],
      raw: true,
    })) as unknown as Array<{ status: BoqStatus; count: string }>;

    const counts = Object.fromEntries(
      rows.map((r) => [r.status, Number(r.count)]),
    ) as Partial<Record<BoqStatus, number>>;

    return {
      draft: counts[BoqStatus.DRAFT] ?? 0,
      awaiting_approval: counts[BoqStatus.AWAITING_APPROVAL] ?? 0,
      approved: counts[BoqStatus.APPROVED] ?? 0,
      archived: counts[BoqStatus.ARCHIVED] ?? 0,
    };
  }

  async getRecentlyEdited(limit = 5) {
    const rows = await this.boqModel.findAll({
      attributes: ['id', 'boq_number', 'title', 'version', 'updated_at'],
      include: [{ model: Project, as: 'project', attributes: ['name'] }],
      order: [['updated_at', 'DESC']],
      limit,
    });

    return rows.map((b) => ({
      id: b.id,
      boq_number: b.boq_number,
      title: b.title,
      project_name: b.project?.name ?? null,
      updated_at: b.get('updatedAt'),
    }));
  }

  // ---------- helpers ----------

  private monthBuckets(months: number): MonthBucket[] {
    const now = new Date();
    const buckets: MonthBucket[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;
      const label = start.toLocaleString('en-US', { month: 'short' });
      buckets.push({ key, label, start });
    }

    return buckets;
  }

  /**
   * NOTE: uses MySQL's DATE_FORMAT — swap for `to_char`/`date_trunc`
   * if this project runs on Postgres instead.
   */
  private async monthlyCounts(months: number, dateColumn: 'created_at') {
    const buckets = this.monthBuckets(months);

    const rows = (await this.boqModel.findAll({
      attributes: [
        [fn('DATE_FORMAT', col(dateColumn), '%Y-%m'), 'bucket'],
        [fn('COUNT', col('id')), 'count'],
      ],
      where: { [dateColumn]: { [Op.gte]: buckets[0].start } },
      group: ['bucket'],
      raw: true,
    })) as unknown as Array<{ bucket: string; count: string }>;

    const byBucket = new Map(rows.map((r) => [r.bucket, Number(r.count)]));

    return buckets.map((b) => ({
      key: b.key,
      label: b.label,
      count: byBucket.get(b.key) ?? 0,
    }));
  }
}
