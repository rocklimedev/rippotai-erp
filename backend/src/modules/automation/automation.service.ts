import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import { QueryTypes } from 'sequelize';
import { randomUUID } from 'crypto';
import { AutomationEngineService, parseRule } from './automation-engine.service';
import { ACTION_TYPES, OPERATORS, RECIPIENTS, TRIGGERS, triggerByType } from './automation.triggers';

const STATUSES = ['ACTIVE', 'DRAFT', 'DISABLED'];

const j = (v: any, f: any) => {
  if (v === null || v === undefined || v === '') return f;
  if (typeof v === 'object') return v;
  try {
    return JSON.parse(v);
  } catch {
    return f;
  }
};

const runOut = (r: any) => ({
  id: r.id,
  number: `RUN-${String(r.seq).padStart(6, '0')}`,
  ruleId: r.rule_id,
  rule: r.rule_name,
  triggerType: r.trigger_type,
  trigger: triggerByType(r.trigger_type)?.label || r.trigger_type,
  source: r.source,
  projectId: r.project_id,
  project: r.project_name || null,
  entityType: r.entity_type,
  entityId: r.entity_id,
  entity: r.entity_label,
  status: r.status,
  durationMs: r.duration_ms,
  startedAt: r.started_at,
  completedAt: r.completed_at,
  error: r.error,
  payload: j(r.payload_json, undefined),
  conditions: j(r.conditions_json, undefined),
  actions: j(r.actions_json, undefined),
});

@Injectable()
export class AutomationService {
  constructor(
    private readonly sequelize: Sequelize,
    private readonly engine: AutomationEngineService,
  ) {}

  private select<T = any>(sql: string, r: any[] = []): Promise<T[]> {
    return this.sequelize.query(sql, { replacements: r, type: QueryTypes.SELECT }) as Promise<T[]>;
  }
  private exec(sql: string, r: any[] = []) {
    return this.sequelize.query(sql, { replacements: r });
  }

  async audit(user: any, action: string, ruleId: string | null, target: string, description: string) {
    await this.exec(
      `INSERT INTO automation_audit_logs (id, user_id, user_name, action, rule_id, target, description, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [randomUUID(), user?.id || null, user?.name || 'System', action, ruleId, target, description],
    );
  }

  catalog() {
    return {
      triggers: TRIGGERS.map(({ sql, ...t }) => t),
      recipients: RECIPIENTS.map(({ key, label }) => ({ key, label })),
      actions: ACTION_TYPES,
      operators: OPERATORS,
    };
  }

  private ruleOut(r: any, stats?: any) {
    const p = parseRule(r) as any;
    const def = triggerByType(p.trigger_type);
    return {
      id: p.id,
      code: p.code,
      name: p.name,
      description: p.description,
      phase: p.phase || def?.phase || null,
      triggerType: p.trigger_type,
      trigger: def?.label || p.trigger_type,
      entity: def?.entity,
      params: p.trigger?.params || {},
      conditions: p.conditions,
      actions: p.actions,
      projectTypes: p.project_types || [],
      status: p.status,
      lastRunAt: p.last_run_at,
      updatedAt: p.updated_at,
      updatedBy: r.updated_by_name || null,
      runs: Number(stats?.runs || 0),
      failed: Number(stats?.failed || 0),
      successRate: stats?.runs ? Math.round((1000 * (stats.runs - stats.failed)) / stats.runs) / 10 : null,
    };
  }

  private async ruleStats() {
    const rows = await this.select(
      `SELECT rule_id, COUNT(*) runs, SUM(status = 'FAILED') failed FROM automation_runs GROUP BY rule_id`,
    );
    return new Map(rows.map((r: any) => [r.rule_id, r]));
  }

  async listRules() {
    const [rows, stats] = await Promise.all([
      this.select(
        `SELECT r.*, u.name AS updated_by_name FROM automation_rules r LEFT JOIN users u ON u.id = r.updated_by ORDER BY r.status = 'ACTIVE' DESC, r.name`,
      ),
      this.ruleStats(),
    ]);
    return rows.map((r) => this.ruleOut(r, stats.get(r.id)));
  }

  async getRule(id: string) {
    const [r] = await this.select(
      `SELECT r.*, u.name AS updated_by_name FROM automation_rules r LEFT JOIN users u ON u.id = r.updated_by WHERE r.id = ?`,
      [id],
    );
    if (!r) throw new NotFoundException('Automation rule not found');
    const stats = await this.ruleStats();
    return this.ruleOut(r, stats.get(id));
  }

  private validate(dto: any, partial = false) {
    if (!partial || dto.name !== undefined) {
      if (!String(dto.name || '').trim()) throw new BadRequestException('Name is required');
    }
    if (!partial || dto.triggerType !== undefined) {
      if (!triggerByType(dto.triggerType)) throw new BadRequestException('Unknown trigger');
    }
    if (dto.status !== undefined && !STATUSES.includes(dto.status)) throw new BadRequestException('Invalid status');
    if (dto.actions !== undefined) {
      if (!Array.isArray(dto.actions)) throw new BadRequestException('actions must be an array');
      for (const a of dto.actions) {
        if (!ACTION_TYPES.some((t) => t.value === a.type)) throw new BadRequestException(`Unknown action ${a.type}`);
        if (!RECIPIENTS.some((r) => r.key === a.recipient)) throw new BadRequestException(`Unknown recipient ${a.recipient}`);
      }
      if (dto.status === 'ACTIVE' && !dto.actions.length) throw new BadRequestException('An active rule needs at least one action');
    }
    if (dto.conditions !== undefined) {
      if (!Array.isArray(dto.conditions)) throw new BadRequestException('conditions must be an array');
      for (const c of dto.conditions)
        if (!c.field || !OPERATORS.includes(c.operator)) throw new BadRequestException('Invalid condition');
    }
  }

  private codeFrom(name: string) {
    return (
      String(name)
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '_')
        .replace(/^_|_$/g, '')
        .slice(0, 48) || 'RULE'
    );
  }

  async createRule(dto: any, user: any) {
    this.validate(dto);
    const id = randomUUID();
    let code = this.codeFrom(dto.code || dto.name);
    const [dup] = await this.select('SELECT id FROM automation_rules WHERE code = ?', [code]);
    if (dup) code = `${code.slice(0, 50)}_${id.slice(0, 6).toUpperCase()}`;
    await this.exec(
      `INSERT INTO automation_rules (id, code, name, description, phase, trigger_type, trigger_json, conditions_json, actions_json, project_types, status, created_by, updated_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        id,
        code,
        dto.name.trim(),
        dto.description || null,
        dto.phase || triggerByType(dto.triggerType)?.phase || null,
        dto.triggerType,
        JSON.stringify({ params: dto.params || {} }),
        JSON.stringify(dto.conditions || []),
        JSON.stringify(dto.actions || []),
        JSON.stringify(dto.projectTypes || []),
        dto.status || 'DRAFT',
        user?.id || null,
        user?.id || null,
      ],
    );
    await this.audit(user, 'CREATED_RULE', id, code, `Created rule “${dto.name.trim()}” (${dto.status || 'DRAFT'}).`);
    return this.getRule(id);
  }

  async updateRule(id: string, dto: any, user: any) {
    const before = await this.getRule(id);
    this.validate({ ...dto, status: dto.status ?? before.status, actions: dto.actions ?? before.actions }, true);
    const sets: string[] = [];
    const vals: any[] = [];
    const set = (col: string, v: any) => {
      sets.push(`${col} = ?`);
      vals.push(v);
    };
    if (dto.name !== undefined) set('name', String(dto.name).trim());
    if (dto.description !== undefined) set('description', dto.description || null);
    if (dto.phase !== undefined) set('phase', dto.phase || null);
    if (dto.triggerType !== undefined) set('trigger_type', dto.triggerType);
    if (dto.params !== undefined) set('trigger_json', JSON.stringify({ params: dto.params || {} }));
    if (dto.conditions !== undefined) set('conditions_json', JSON.stringify(dto.conditions));
    if (dto.actions !== undefined) set('actions_json', JSON.stringify(dto.actions));
    if (dto.projectTypes !== undefined) set('project_types', JSON.stringify(dto.projectTypes));
    if (dto.status !== undefined) set('status', dto.status);
    set('updated_by', user?.id || null);
    await this.exec(`UPDATE automation_rules SET ${sets.join(', ')}, updated_at = NOW() WHERE id = ?`, [...vals, id]);

    const changed = Object.keys(dto).filter((k) => JSON.stringify(dto[k]) !== JSON.stringify((before as any)[k]));
    const action =
      dto.status && dto.status !== before.status && changed.length === 1
        ? dto.status === 'ACTIVE'
          ? 'ENABLED_RULE'
          : dto.status === 'DISABLED'
            ? 'DISABLED_RULE'
            : 'UPDATED_RULE'
        : 'UPDATED_RULE';
    await this.audit(
      user,
      action,
      id,
      before.code,
      action === 'UPDATED_RULE' ? `Changed ${changed.join(', ') || 'nothing'}.` : `${action === 'ENABLED_RULE' ? 'Enabled' : 'Disabled'} rule.`,
    );
    return this.getRule(id);
  }

  async toggleRule(id: string, user: any) {
    const r = await this.getRule(id);
    return this.updateRule(id, { status: r.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE' }, user);
  }

  async duplicateRule(id: string, user: any) {
    const r = await this.getRule(id);
    return this.createRule(
      {
        name: `${r.name} (copy)`,
        description: r.description,
        phase: r.phase,
        triggerType: r.triggerType,
        params: r.params,
        conditions: r.conditions,
        actions: r.actions,
        projectTypes: r.projectTypes,
        status: 'DRAFT',
      },
      user,
    );
  }

  async deleteRule(id: string, user: any) {
    const r = await this.getRule(id);
    await this.exec('DELETE FROM automation_rules WHERE id = ?', [id]);
    await this.audit(user, 'DELETED_RULE', null, r.code, `Deleted rule “${r.name}”.`);
    return { ok: true };
  }

  async runRule(id: string, user: any, dryRun = false) {
    const res = await this.engine.runRule(id, { source: dryRun ? 'test' : 'manual', userId: user?.id, dryRun });
    if (!dryRun)
      await this.audit(user, 'RAN_RULE', id, res.rule.name, `Run now: ${res.matched} matched, ${res.executed} executed, ${res.cooldown} already handled.`);
    return res;
  }

  /** Test an unsaved rule definition (builder preview) — evaluation only, nothing is written. */
  async testDraft(dto: any) {
    this.validate({ ...dto, name: dto.name || 'Draft', status: 'DRAFT' });
    return this.engine.runRule(
      {
        id: 'draft',
        code: 'DRAFT',
        name: dto.name || 'Draft',
        phase: dto.phase || null,
        trigger_type: dto.triggerType,
        trigger: { params: dto.params || {} },
        conditions: dto.conditions || [],
        actions: dto.actions || [],
        status: 'DRAFT',
      },
      { source: 'test', dryRun: true },
    );
  }

  async runAll(user: any) {
    const res = await this.engine.runAll({ source: 'manual', userId: user?.id });
    await this.audit(user, 'RAN_ALL', null, 'All active rules', `Run now: ${(res as any).executed ?? 0} executions across ${(res as any).rules ?? 0} rules.`);
    return res;
  }

  // ------------------------------------------------------------------ runs

  async listRuns(q: { status?: string; ruleId?: string; search?: string; limit?: string }) {
    const where: string[] = ['1=1'];
    const r: any[] = [];
    if (q.status && q.status !== 'ALL') {
      where.push('x.status = ?');
      r.push(q.status);
    }
    if (q.ruleId) {
      where.push('x.rule_id = ?');
      r.push(q.ruleId);
    }
    if (q.search) {
      where.push('(x.rule_name LIKE ? OR x.entity_label LIKE ? OR p.name LIKE ?)');
      r.push(`%${q.search}%`, `%${q.search}%`, `%${q.search}%`);
    }
    const limit = Math.min(Number(q.limit) || 200, 500);
    const rows = await this.select(
      `SELECT x.*, p.name AS project_name FROM automation_runs x LEFT JOIN projects p ON p.id = x.project_id
        WHERE ${where.join(' AND ')} ORDER BY x.started_at DESC LIMIT ${limit}`,
      r,
    );
    return rows.map((row) => {
      const o = runOut(row);
      delete o.payload;
      delete (o as any).conditions;
      return o;
    });
  }

  async getRun(id: string) {
    const [row] = await this.select(
      `SELECT x.*, p.name AS project_name FROM automation_runs x LEFT JOIN projects p ON p.id = x.project_id
        WHERE x.id = ? OR CONCAT('RUN-', LPAD(x.seq, 6, '0')) = ?`,
      [id, id],
    );
    if (!row) throw new NotFoundException('Run not found');
    return runOut(row);
  }

  // ------------------------------------------------------------------ escalations

  async listEscalations(status?: string) {
    const rows = await this.select(
      `SELECT e.*, p.name AS project_name, u.name AS assignee_name, r.name AS rule_name,
              TIMESTAMPDIFF(HOUR, e.opened_at, COALESCE(e.resolved_at, NOW())) AS age_hours
         FROM automation_escalations e
         LEFT JOIN projects p ON p.id = e.project_id
         LEFT JOIN users u ON u.id = e.assigned_to
         LEFT JOIN automation_rules r ON r.id = e.rule_id
        ${status && status !== 'ALL' ? 'WHERE e.status = ?' : ''}
        ORDER BY e.status = 'RESOLVED', FIELD(e.priority, 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'), e.opened_at DESC`,
      status && status !== 'ALL' ? [status] : [],
    );
    return rows.map((e: any) => ({
      id: e.id,
      title: e.title,
      details: e.details,
      type: e.entity_type,
      entityId: e.entity_id,
      projectId: e.project_id,
      project: e.project_name,
      rule: e.rule_name,
      ruleId: e.rule_id,
      runId: e.run_id,
      priority: e.priority,
      level: e.level,
      assignedTo: e.assignee_name || e.assigned_role,
      assignedRole: e.assigned_role,
      status: e.status,
      ageHours: Number(e.age_hours || 0),
      openedAt: e.opened_at,
      resolvedAt: e.resolved_at,
      notes: e.resolution_notes,
    }));
  }

  async updateEscalation(id: string, dto: { status?: string; notes?: string }, user: any) {
    const [e] = await this.select('SELECT * FROM automation_escalations WHERE id = ?', [id]);
    if (!e) throw new NotFoundException('Escalation not found');
    const status = dto.status || e.status;
    if (!['OPEN', 'ACKNOWLEDGED', 'RESOLVED'].includes(status)) throw new BadRequestException('Invalid status');
    await this.exec(
      `UPDATE automation_escalations SET status = ?, resolution_notes = COALESCE(?, resolution_notes),
              acknowledged_at = IF(? = 'ACKNOWLEDGED' AND acknowledged_at IS NULL, NOW(), acknowledged_at),
              resolved_at = IF(? = 'RESOLVED', NOW(), NULL), resolved_by = IF(? = 'RESOLVED', ?, NULL)
        WHERE id = ?`,
      [status, dto.notes ?? null, status, status, status, user?.id || null, id],
    );
    await this.audit(user, status === 'RESOLVED' ? 'RESOLVED_ESCALATION' : 'UPDATED_ESCALATION', e.rule_id, e.title, `Escalation marked ${status.toLowerCase()}${dto.notes ? `: ${dto.notes}` : ''}.`);
    return (await this.listEscalations()).find((x) => x.id === id);
  }

  // ------------------------------------------------------------------ audit + overview

  async listAudit(limit = 200) {
    const rows = await this.select(
      `SELECT * FROM automation_audit_logs ORDER BY created_at DESC LIMIT ${Math.min(Number(limit) || 200, 500)}`,
    );
    return rows.map((a: any) => ({
      id: a.id,
      user: a.user_name,
      action: a.action,
      ruleId: a.rule_id,
      target: a.target,
      description: a.description,
      timestamp: a.created_at,
    }));
  }

  async overview() {
    const [[rules], [today], [month], [esc], recent, rulesList] = await Promise.all([
      this.select(`SELECT SUM(status='ACTIVE') active, SUM(status='DRAFT') draft, SUM(status='DISABLED') disabled, COUNT(*) total FROM automation_rules`),
      this.select(`SELECT COUNT(*) runs, SUM(status='FAILED') failed FROM automation_runs WHERE started_at >= CURDATE()`),
      this.select(`SELECT COUNT(*) runs, SUM(status='FAILED') failed FROM automation_runs WHERE started_at >= NOW() - INTERVAL 30 DAY`),
      this.select(`SELECT SUM(status<>'RESOLVED') open, SUM(status<>'RESOLVED' AND priority='CRITICAL') critical FROM automation_escalations`),
      this.listRuns({ limit: '8' }),
      this.listRules(),
    ]);
    const phases = new Map<string, { phase: string; rules: number; active: number; runs: number }>();
    for (const r of rulesList) {
      const k = r.phase || 'Other';
      const p = phases.get(k) || { phase: k, rules: 0, active: 0, runs: 0 };
      p.rules += 1;
      p.active += r.status === 'ACTIVE' ? 1 : 0;
      p.runs += r.runs;
      phases.set(k, p);
    }
    const mRuns = Number(month?.runs || 0);
    const mFailed = Number(month?.failed || 0);
    return {
      stats: {
        activeRules: Number(rules?.active || 0),
        draftRules: Number(rules?.draft || 0),
        totalRules: Number(rules?.total || 0),
        runsToday: Number(today?.runs || 0),
        failedToday: Number(today?.failed || 0),
        runs30d: mRuns,
        failed30d: mFailed,
        successRate: mRuns ? Math.round((1000 * (mRuns - mFailed)) / mRuns) / 10 : null,
        openEscalations: Number(esc?.open || 0),
        criticalEscalations: Number(esc?.critical || 0),
      },
      phases: [...phases.values()],
      topRules: [...rulesList].sort((a, b) => b.runs - a.runs).slice(0, 5),
      recentRuns: recent,
      scheduleMinutes: Number(process.env.AUTOMATION_INTERVAL_MIN ?? 30),
    };
  }
}
