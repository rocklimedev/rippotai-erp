import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import { QueryTypes } from 'sequelize';
import { randomUUID } from 'crypto';
import { NotificationsService } from '../engagement/notifications.service';
import { NotificationType } from '@/common/enums';
import { automationBus, AutomationEvent } from '@/common/automation-bus';
import { RECIPIENTS, TriggerDef, triggerByType, TRIGGERS } from './automation.triggers';

export interface RuleRow {
  id: string;
  code: string;
  name: string;
  phase: string | null;
  trigger_type: string;
  trigger: { params?: Record<string, number> };
  conditions: { field: string; operator: string; value: any }[];
  actions: {
    type: 'NOTIFY' | 'TASK' | 'ESCALATE';
    recipient: string;
    title?: string;
    message?: string;
    priority?: string;
    dueInDays?: number;
  }[];
  status: 'ACTIVE' | 'DRAFT' | 'DISABLED';
  updated_by?: string | null;
  created_by?: string | null;
}

export interface RunOptions {
  source: 'manual' | 'schedule' | 'event' | 'test';
  entityId?: string | number;
  userId?: string | null;
  /** test = evaluate only; nothing is written (no runs, notifications, tasks). */
  dryRun?: boolean;
  limit?: number;
}

const json = (v: any, fallback: any) => {
  if (v === null || v === undefined || v === '') return fallback;
  if (typeof v === 'object') return v;
  try {
    return JSON.parse(v);
  } catch {
    return fallback;
  }
};

export const parseRule = (r: any): RuleRow => ({
  ...r,
  trigger: json(r.trigger_json, {}),
  conditions: json(r.conditions_json, []),
  actions: json(r.actions_json, []),
  project_types: json(r.project_types, []),
});

const fmtINR = (n: any) =>
  Number.isFinite(Number(n)) ? `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : String(n ?? '');

function render(template: string | undefined, payload: Record<string, any>) {
  return String(template || '').replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => {
    const v = payload[k];
    if (v === null || v === undefined) return '';
    if (['amount', 'outstanding', 'paid'].includes(k)) return fmtINR(v);
    if (v instanceof Date) return v.toISOString().slice(0, 10);
    return String(v);
  });
}

export function evalCondition(c: { field: string; operator: string; value: any }, payload: Record<string, any>) {
  const actual = payload[c.field];
  const expected = c.value;
  const num = (x: any) => Number(x);
  switch (c.operator) {
    case 'equals':
      return String(actual ?? '').toLowerCase() === String(expected ?? '').toLowerCase();
    case 'not_equals':
      return String(actual ?? '').toLowerCase() !== String(expected ?? '').toLowerCase();
    case 'greater_than':
      return num(actual) > num(expected);
    case 'less_than':
      return num(actual) < num(expected);
    case 'contains':
      return String(actual ?? '').toLowerCase().includes(String(expected ?? '').toLowerCase());
    case 'in':
      return String(expected ?? '')
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .includes(String(actual ?? '').toLowerCase());
    default:
      return false;
  }
}

const OP_LABEL: Record<string, string> = {
  equals: 'is',
  not_equals: 'is not',
  greater_than: '>',
  less_than: '<',
  contains: 'contains',
  in: 'is one of',
};

@Injectable()
export class AutomationEngineService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('Automation');
  private timer: NodeJS.Timeout | null = null;
  private running = false;
  private listeners: [AutomationEvent, (...a: any[]) => void][] = [];

  constructor(
    private readonly sequelize: Sequelize,
    private readonly notifications: NotificationsService,
  ) {}

  // ------------------------------------------------------------------ lifecycle

  onModuleInit() {
    // Event hooks: domain services emit on the bus, we evaluate matching ACTIVE rules for that entity only.
    for (const t of TRIGGERS.filter((x) => x.eventHook)) {
      const fn = (p: { entityId: string | number }) =>
        this.runForEvent(t.type as AutomationEvent, p.entityId).catch((e) =>
          this.logger.warn(`event ${t.type} failed: ${e?.message}`),
        );
      automationBus.on(t.type, fn);
      this.listeners.push([t.type as AutomationEvent, fn]);
    }

    // Cron-less schedule: evaluate all ACTIVE rules every N minutes (AUTOMATION_INTERVAL_MIN, 0 = off).
    const minutes = Number(process.env.AUTOMATION_INTERVAL_MIN ?? 30);
    if (minutes > 0) {
      this.timer = setInterval(() => {
        this.runAll({ source: 'schedule' }).catch((e) => this.logger.warn(`scheduled run failed: ${e?.message}`));
      }, minutes * 60_000);
      this.timer.unref?.();
    }
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
    for (const [ev, fn] of this.listeners) automationBus.off(ev, fn);
  }

  // ------------------------------------------------------------------ helpers

  private select<T = any>(sql: string, replacements: any[] = []): Promise<T[]> {
    return this.sequelize.query(sql, { replacements, type: QueryTypes.SELECT }) as Promise<T[]>;
  }

  private exec(sql: string, replacements: any[] = []) {
    return this.sequelize.query(sql, { replacements });
  }

  private async loadRule(id: string): Promise<RuleRow> {
    const [row] = await this.select('SELECT * FROM automation_rules WHERE id = ? OR code = ?', [id, id]);
    if (!row) throw new NotFoundException('Automation rule not found');
    return parseRule(row);
  }

  private param(rule: RuleRow, def: TriggerDef, key: string) {
    const v = rule.trigger?.params?.[key];
    if (v !== undefined && v !== null && (v as any) !== '' && Number.isFinite(Number(v))) return Number(v);
    return def.params.find((p) => p.key === key)?.default ?? 0;
  }

  async candidates(rule: RuleRow, entityId?: string | number) {
    const def = triggerByType(rule.trigger_type);
    if (!def) throw new NotFoundException(`Unknown trigger ${rule.trigger_type}`);
    const main = this.param(rule, def, def.mainParam);
    const hasFilter = entityId !== undefined && entityId !== null;
    const repl = hasFilter ? (def.filterFirst ? [entityId, main] : [main, entityId]) : [main];
    const rows = await this.select(def.sql(hasFilter), repl);
    for (const r of rows) {
      // "05_DESIGN" → "Design" for messages and conditions.
      if (typeof r.currentPhase === 'string' && /^\d+_/.test(r.currentPhase)) {
        r.currentPhase = r.currentPhase
          .replace(/^\d+_/, '')
          .replace(/_/g, ' ')
          .toLowerCase()
          .replace(/^\w/, (c: string) => c.toUpperCase());
      }
    }
    return { def, rows };
  }

  /** Resolve an action recipient key to user ids (project team members first, else everyone with that job). */
  private async recipients(key: string, payload: any): Promise<{ id: string; name: string }[]> {
    if (key === 'assignee') {
      if (!payload.assigneeId) return this.recipients('project_manager', payload);
      return this.select('SELECT id, name FROM users WHERE id = ? AND is_active = 1', [payload.assigneeId]);
    }
    const def = RECIPIENTS.find((r) => r.key === key);
    if (!def) return [];
    let base: { id: string; name: string }[] = [];
    if (def.role) {
      base = await this.select(
        `SELECT u.id, u.name FROM users u JOIN roles r ON r.id = u.role_id WHERE u.is_active = 1 AND r.name = ?`,
        [def.role],
      );
    } else if (def.jobTitle) {
      base = await this.select(
        `SELECT id, name FROM users WHERE is_active = 1 AND (${def.jobTitle.map(() => 'job_title LIKE ?').join(' OR ')})`,
        def.jobTitle,
      );
    }
    if (!payload.project_id || base.length <= 1) return base;
    const team = await this.select<{ user_id: string }>(
      `SELECT DISTINCT user_id FROM team_members WHERE owner_type = 'PROJECT' AND owner_id = ? AND deleted_at IS NULL`,
      [payload.project_id],
    );
    const onTeam = base.filter((u) => team.some((t) => t.user_id === u.id));
    return onTeam.length ? onTeam : base;
  }

  private async recentlyHandled(rule: RuleRow, def: TriggerDef, entityId: any) {
    const hours = this.param(rule, def, 'cooldownHours') || 24;
    const [row] = await this.select(
      `SELECT id FROM automation_runs WHERE rule_id = ? AND entity_type = ? AND entity_id = ?
          AND status = 'SUCCESS' AND started_at > NOW() - INTERVAL ? HOUR LIMIT 1`,
      [rule.id, def.entity, String(entityId), hours],
    );
    return !!row;
  }

  // ------------------------------------------------------------------ actions

  private async runAction(
    rule: RuleRow,
    action: RuleRow['actions'][number],
    payload: Record<string, any>,
    ctx: { runId: string; def: TriggerDef; userId?: string | null },
  ): Promise<{ label: string; status: 'SUCCESS' | 'FAILED' | 'SKIPPED'; detail?: string }> {
    const people = await this.recipients(action.recipient, payload);
    const who = RECIPIENTS.find((r) => r.key === action.recipient)?.label || action.recipient;
    const title = render(action.title, payload) || `${rule.name}: ${payload.entity_label || ''}`.trim();
    const message =
      render(action.message, payload) ||
      [payload.projectName, payload.entity_label].filter(Boolean).join(' — ');

    if (action.type === 'NOTIFY') {
      if (!people.length) return { label: `Notify ${who}`, status: 'SKIPPED', detail: 'No matching users' };
      await this.notifications.createMany(
        people.map((u) => ({
          user_id: u.id,
          type: NotificationType.REMINDER,
          title: title.slice(0, 255),
          message,
          entity_type: 'automation_run',
          entity_id: ctx.runId,
        })) as any,
      );
      return { label: `Notified ${who}`, status: 'SUCCESS', detail: people.map((p) => p.name).join(', ') };
    }

    if (action.type === 'TASK') {
      const assignee = people[0];
      const due = new Date(Date.now() + (Number(action.dueInDays ?? 2) || 0) * 86_400_000);
      const creator =
        ctx.userId || rule.updated_by || rule.created_by || assignee?.id || null;
      const pri = ['low', 'medium', 'high', 'critical'].includes(String(action.priority).toLowerCase())
        ? String(action.priority).toLowerCase()
        : 'high';
      const taskId = randomUUID();
      await this.exec(
        `INSERT INTO tasks (id, title, description, project_id, created_by, assigned_to, priority, status, start_date, due_date, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'todo', NOW(), ?, NOW(), NOW())`,
        [
          taskId,
          title.slice(0, 255),
          `${message}\n\nCreated by automation “${rule.name}” (run ${ctx.runId.slice(0, 8)}).`,
          payload.project_id || null,
          creator,
          assignee?.id || null,
          pri,
          due,
        ],
      );
      return {
        label: `Task created${assignee ? ` for ${assignee.name}` : ''}`,
        status: 'SUCCESS',
        detail: taskId,
      };
    }

    if (action.type === 'ESCALATE') {
      const [open] = await this.select(
        `SELECT id, level FROM automation_escalations
          WHERE rule_id = ? AND entity_type = ? AND entity_id = ? AND status <> 'RESOLVED' LIMIT 1`,
        [rule.id, ctx.def.entity, String(payload.entity_id)],
      );
      const priority = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(String(action.priority).toUpperCase())
        ? String(action.priority).toUpperCase()
        : 'HIGH';
      if (open) {
        await this.exec(
          `UPDATE automation_escalations SET level = level + 1, priority = ?, run_id = ? WHERE id = ?`,
          [priority, ctx.runId, open.id],
        );
        return { label: `Escalation raised to level ${Number(open.level) + 1}`, status: 'SUCCESS', detail: open.id };
      }
      const id = randomUUID();
      await this.exec(
        `INSERT INTO automation_escalations (id, rule_id, run_id, project_id, entity_type, entity_id, title, details, priority, level, assigned_to, assigned_role, status, opened_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, 'OPEN', NOW())`,
        [
          id,
          rule.id,
          ctx.runId,
          payload.project_id || null,
          ctx.def.entity,
          String(payload.entity_id),
          title.slice(0, 255),
          message,
          priority,
          people[0]?.id || null,
          who,
        ],
      );
      if (people.length) {
        await this.notifications.createMany(
          people.map((u) => ({
            user_id: u.id,
            type: 'system' as any,
            title: `Escalation: ${title}`.slice(0, 255),
            message,
            entity_type: 'automation_escalation',
            entity_id: id,
          })) as any,
        );
      }
      return { label: `Escalation opened for ${who}`, status: 'SUCCESS', detail: id };
    }

    return { label: `Unknown action ${action.type}`, status: 'SKIPPED' };
  }

  // ------------------------------------------------------------------ run

  async runRule(ruleOrId: RuleRow | string, opts: RunOptions) {
    const rule = typeof ruleOrId === 'string' ? await this.loadRule(ruleOrId) : ruleOrId;
    const { def, rows } = await this.candidates(rule, opts.entityId);
    const summary = {
      rule: { id: rule.id, name: rule.name },
      candidates: rows.length,
      matched: 0,
      executed: 0,
      cooldown: 0,
      failed: 0,
      runs: [] as any[],
      preview: [] as any[],
    };

    for (const row of rows.slice(0, opts.limit ?? 200)) {
      const payload = { ...row };
      const conds = (rule.conditions || []).map((c) => ({
        label: `${def.fields.find((f) => f.key === c.field)?.label || c.field} ${OP_LABEL[c.operator] || c.operator} ${c.value}`,
        passed: evalCondition(c, payload),
      }));
      if (conds.some((c) => !c.passed)) continue;
      summary.matched += 1;

      if (opts.dryRun) {
        if (summary.preview.length < 25)
          summary.preview.push({ entity: payload.entity_label, project: payload.projectName, conditions: conds });
        continue;
      }
      if (opts.source !== 'event' && (await this.recentlyHandled(rule, def, payload.entity_id))) {
        summary.cooldown += 1;
        continue;
      }

      const runId = randomUUID();
      const started = new Date();
      const actions: any[] = [];
      let error: string | null = null;
      for (const a of rule.actions || []) {
        try {
          actions.push(await this.runAction(rule, a, payload, { runId, def, userId: opts.userId }));
        } catch (e: any) {
          error = e?.message || String(e);
          actions.push({ label: `${a.type} ${a.recipient}`, status: 'FAILED', detail: error });
        }
      }
      const status = actions.some((a) => a.status === 'FAILED') ? 'FAILED' : 'SUCCESS';
      const completed = new Date();
      await this.exec(
        `INSERT INTO automation_runs (id, rule_id, rule_name, trigger_type, source, project_id, entity_type, entity_id, entity_label,
                                      status, duration_ms, payload_json, conditions_json, actions_json, error, triggered_by, started_at, completed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          runId,
          rule.id,
          rule.name,
          rule.trigger_type,
          opts.source,
          payload.project_id || null,
          def.entity,
          String(payload.entity_id),
          String(payload.entity_label || '').slice(0, 255),
          status,
          completed.getTime() - started.getTime(),
          JSON.stringify(payload),
          JSON.stringify(conds),
          JSON.stringify(actions),
          error,
          opts.userId || null,
          started,
          completed,
        ],
      );
      summary.executed += 1;
      if (status === 'FAILED') summary.failed += 1;
      summary.runs.push({ id: runId, entity: payload.entity_label, status });
    }

    if (!opts.dryRun && rule.id !== 'draft') await this.exec('UPDATE automation_rules SET last_run_at = NOW() WHERE id = ?', [rule.id]);
    return summary;
  }

  async runAll(opts: RunOptions) {
    if (this.running && opts.source === 'schedule') return { skipped: 'already running' };
    this.running = true;
    try {
      const rules = (await this.select(`SELECT * FROM automation_rules WHERE status = 'ACTIVE'`)).map(parseRule);
      const results: any[] = [];
      for (const r of rules) {
        try {
          results.push(await this.runRule(r, opts));
        } catch (e: any) {
          results.push({ rule: { id: r.id, name: r.name }, error: e?.message });
        }
      }
      return {
        rules: results.length,
        executed: results.reduce((s, r) => s + (r.executed || 0), 0),
        failed: results.reduce((s, r) => s + (r.failed || 0), 0),
        results,
      };
    } finally {
      this.running = false;
    }
  }

  async runForEvent(event: AutomationEvent, entityId: string | number) {
    const rules = (
      await this.select(`SELECT * FROM automation_rules WHERE status = 'ACTIVE' AND trigger_type = ?`, [event])
    ).map(parseRule);
    for (const r of rules) await this.runRule(r, { source: 'event', entityId });
  }
}
