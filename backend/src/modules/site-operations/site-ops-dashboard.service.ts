import { Injectable, Logger } from '@nestjs/common';
import { QueryTypes } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';

/**
 * Aggregates for the Site Operations dashboard (GET /site-ops/dashboard).
 * Raw SQL keeps it cheap and tolerant: a table that is empty or missing just yields zeros.
 * Keys are snake_case to match the dashboard widget contract in the frontend (src/widgets/siteops).
 */
@Injectable()
export class SiteOpsDashboardService {
  private readonly logger = new Logger(SiteOpsDashboardService.name);

  constructor(private readonly sequelize: Sequelize) {}

  private async rows<T extends object = any>(
    sql: string,
    replacements: any = {},
  ): Promise<T[]> {
    try {
      return (await this.sequelize.query(sql, {
        type: QueryTypes.SELECT,
        replacements,
      })) as T[];
    } catch (e) {
      this.logger.warn(`dashboard query failed: ${(e as Error).message}`);
      return [];
    }
  }

  private async one(sql: string, replacements: any = {}): Promise<number> {
    const r = await this.rows<{ n: number }>(sql, replacements);
    return Number(r[0]?.n ?? 0);
  }

  async getDashboard(projectId?: string) {
    const today = new Date();
    const iso = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const todayStr = iso(today);
    const from = new Date(today);
    from.setDate(from.getDate() - 30);
    const fromStr = iso(from);

    // Every site-ops table keys projects by UUID (projects.id), so one filter fits all of them.
    const pWhere = projectId ? 'AND r.project_id = :projectId' : '';
    const pAnd = projectId ? 'AND project_id = :projectId' : '';
    const rep = { projectId, today: todayStr, from: fromStr };

    const [
      todayReports,
      todayShared,
      totalReports,
      reportsWithIssues,
      manpowerToday,
      openRfis,
      pendingMockups,
      passedQc,
      failedQc,
      todayVisits,
      activeProjects,
      reportedProjectsToday,
      handoffBlocked,
    ] = await Promise.all([
      this.one(`SELECT COUNT(*) n FROM daily_site_reports r WHERE r.report_date = :today ${pWhere}`, rep),
      this.one(`SELECT COUNT(*) n FROM daily_site_reports r WHERE r.report_date = :today AND r.is_shared = 1 ${pWhere}`, rep),
      this.one(`SELECT COUNT(*) n FROM daily_site_reports r WHERE r.report_date >= :from ${pWhere}`, rep),
      this.one(
        `SELECT COUNT(*) n FROM daily_site_reports r WHERE r.report_date >= :from
           AND (r.needs_attention = 1 OR COALESCE(JSON_LENGTH(r.issue_items),0) > 0) ${pWhere}`,
        rep,
      ),
      this.one(
        `SELECT COALESCE(SUM(m.headcount),0) n FROM manpower_entries m
           JOIN daily_site_reports r ON r.id = m.daily_site_report_id
          WHERE r.report_date = :today ${pWhere}`,
        rep,
      ),
      this.one(`SELECT COUNT(*) n FROM rfis WHERE status = 'OPEN' ${pAnd}`, rep),
      this.one(`SELECT COUNT(*) n FROM mockups WHERE status IN ('PROPOSED','UNDER_REVIEW') ${pAnd}`, rep),
      this.one(`SELECT COUNT(*) n FROM qc_sign_offs WHERE result = 'PASS' ${pAnd}`, rep),
      this.one(`SELECT COUNT(*) n FROM qc_sign_offs WHERE result IN ('FAIL','REWORK') ${pAnd}`, rep),
      this.one(`SELECT COUNT(*) n FROM site_visit_logs WHERE scheduled_date = :today ${pAnd}`, rep),
      projectId
        ? this.one(`SELECT COUNT(*) n FROM projects WHERE deleted_at IS NULL AND id = :projectId`, rep)
        : this.one(`SELECT COUNT(*) n FROM projects WHERE deleted_at IS NULL AND status = 'active'`),
      this.one(`SELECT COUNT(DISTINCT project_id) n FROM daily_site_reports WHERE report_date = :today ${pAnd}`, rep),
      // open QC failures: the latest attempt for a project/step/trade is still FAIL or REWORK
      this.one(
        `SELECT COUNT(*) n FROM qc_sign_offs q
          WHERE q.result IN ('FAIL','REWORK') ${projectId ? 'AND q.project_id = :projectId' : ''}
            AND q.attempt_number = (SELECT MAX(q2.attempt_number) FROM qc_sign_offs q2
                                     WHERE q2.project_id = q.project_id AND q2.step_id = q.step_id
                                       AND q2.trade_team_id = q.trade_team_id)`,
        rep,
      ),
    ]);

    const reports = await this.rows(
      `SELECT r.id, r.report_date, r.status, r.work_completed, r.is_shared, r.needs_attention,
              r.project_id, p.name AS project_name,
              (SELECT COALESCE(SUM(m.headcount),0) FROM manpower_entries m WHERE m.daily_site_report_id = r.id) AS manpower
         FROM daily_site_reports r LEFT JOIN projects p ON p.id = r.project_id
        WHERE 1=1 ${pWhere}
        ORDER BY r.report_date DESC, r.id DESC LIMIT 8`,
      rep,
    );

    const visits = await this.rows(
      `SELECT r.id, r.visitor_name, r.visitor_type, r.scheduled_date, r.purpose, r.status,
              r.project_id, p.name AS project_name
         FROM site_visit_logs r LEFT JOIN projects p ON p.id = r.project_id
        WHERE 1=1 ${pWhere}
        ORDER BY (r.scheduled_date = :today) DESC, ABS(DATEDIFF(r.scheduled_date, :today)), r.id DESC LIMIT 6`,
      rep,
    );
    const rfis = await this.rows(
      `SELECT r.id, r.rfi_number, r.subject, r.status, r.priority, r.raised_at,
              r.project_id, p.name AS project_name
         FROM rfis r LEFT JOIN projects p ON p.id = r.project_id
        WHERE 1=1 ${pWhere}
        ORDER BY r.raised_at DESC LIMIT 8`,
      rep,
    );
    const mockups = await this.rows(
      `SELECT r.id, r.name, r.finish_type, r.status, r.proposed_at, r.project_id, p.name AS project_name
         FROM mockups r LEFT JOIN projects p ON p.id = r.project_id
        WHERE 1=1 ${pWhere}
        ORDER BY r.proposed_at DESC LIMIT 6`,
      rep,
    );

    const activity = [
      ...reports.map((r: any) => ({
        id: `report-${r.id}`,
        type: 'report',
        ref_id: r.id,
        title: `Daily report · ${r.project_name || 'Project'}`,
        description: r.work_completed || `${r.manpower || 0} on site`,
        date: r.report_date,
        status: r.status,
      })),
      ...rfis.map((r: any) => ({
        id: `rfi-${r.id}`,
        type: 'rfi',
        ref_id: r.id,
        title: r.subject,
        description: `RFI-${String(r.rfi_number).padStart(3, '0')}${r.project_name ? ` · ${r.project_name}` : ''}`,
        date: r.raised_at,
        status: r.status,
      })),
      ...mockups.map((m: any) => ({
        id: `mockup-${m.id}`,
        type: 'mockup',
        ref_id: m.id,
        title: m.name,
        description: [m.finish_type || 'Mockup', m.project_name].filter(Boolean).join(' · '),
        date: m.proposed_at,
        status: m.status,
      })),
    ]
      .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
      .slice(0, 8);

    const qcTotal = passedQc + failedQc;

    return {
      stats: {
        today_report_ready: todayReports > 0,
        today_report_shared: todayShared > 0,
        today_reports: todayReports,
        reported_projects_today: reportedProjectsToday,
        active_projects: activeProjects,
        total_reports: totalReports,
        reports_with_issues: reportsWithIssues,
        manpower_today: manpowerToday,
        open_rfis: openRfis,
        pending_mockups: pendingMockups,
        passed_qc: passedQc,
        failed_qc: failedQc,
        qc_pass_rate: qcTotal ? Math.round((passedQc / qcTotal) * 100) : null,
        handoff_blocked: handoffBlocked,
        today_visits: todayVisits,
      },
      reports: reports.map((r: any) => ({
        ...r,
        is_shared: !!Number(r.is_shared),
        needs_attention: !!Number(r.needs_attention),
        manpower: Number(r.manpower || 0),
      })),
      visits,
      rfis,
      mockups,
      activity,
    };
  }
}
