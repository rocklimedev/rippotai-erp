import {
  BadRequestException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import { QueryTypes } from 'sequelize';
import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import archiver from 'archiver';
import { NotificationsService } from '../engagement/notifications.service';
import { CdnService } from '../cdn/cdn.service';
import { NotificationType } from '@/common/enums';

export const PURPOSES = ['project_view', 'boq_approval', 'quotation_selection', 'handover_acceptance'] as const;
type Purpose = (typeof PURPOSES)[number];

const sha = (s: string) => createHash('sha256').update(s).digest('hex');
const key = () => createHash('sha256').update(`client-links:${process.env.JWT_SECRET || 'inos'}`).digest();

function encrypt(token: string) {
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', key(), iv);
  const enc = Buffer.concat([c.update(token, 'utf8'), c.final()]);
  return [iv, c.getAuthTag(), enc].map((b) => b.toString('base64url')).join('.');
}
function decrypt(v: string | null): string | null {
  if (!v) return null;
  try {
    const [iv, tag, enc] = v.split('.').map((s) => Buffer.from(s, 'base64url'));
    const d = createDecipheriv('aes-256-gcm', key(), iv);
    d.setAuthTag(tag);
    return Buffer.concat([d.update(enc), d.final()]).toString('utf8');
  } catch {
    return null;
  }
}

const j = (v: any, f: any) => {
  if (v === null || v === undefined || v === '') return f;
  if (typeof v === 'object') return v;
  try {
    return JSON.parse(v);
  } catch {
    return f;
  }
};

/** Errors the client portal shows (it reads `detail`). */
const fail = (status: number, detail: string) => new HttpException({ statusCode: status, message: detail, detail }, status);

const titleCase = (s: string) =>
  String(s || '')
    .toLowerCase()
    .replace(/(^|\s)\S/g, (m) => m.toUpperCase());

@Injectable()
export class ClientPortalService {
  constructor(
    private readonly sequelize: Sequelize,
    private readonly notifications: NotificationsService,
    private readonly cdn: CdnService,
  ) {}

  private select<T = any>(sql: string, r: any[] = []): Promise<T[]> {
    return this.sequelize.query(sql, { replacements: r, type: QueryTypes.SELECT }) as Promise<T[]>;
  }
  private exec(sql: string, r: any[] = []) {
    return this.sequelize.query(sql, { replacements: r });
  }

  frontendBase(origin?: string) {
    const env = process.env.FRONTEND_URL || process.env.APP_URL;
    if (env) return env.replace(/\/$/, '');
    if (origin && /^https?:\/\//.test(origin)) return origin.replace(/\/$/, '');
    return 'http://localhost:5173';
  }

  private linkOut(l: any, origin?: string) {
    const token = decrypt(l.token_enc);
    const now = Date.now();
    const state = l.revoked_at ? 'revoked' : new Date(l.expires_at).getTime() < now ? 'expired' : 'active';
    return {
      id: l.id,
      project_id: l.project_id,
      project_name: l.project_name,
      purpose: l.purpose,
      target_id: l.target_id,
      client_name: l.client_name,
      client_email: l.client_email,
      options: j(l.options_json, {}),
      expires_at: l.expires_at,
      revoked_at: l.revoked_at,
      last_opened_at: l.last_opened_at,
      open_count: l.open_count,
      created_at: l.created_at,
      created_by_name: l.created_by_name,
      state,
      token: state === 'active' ? token : undefined,
      url: state === 'active' && token ? `${this.frontendBase(origin)}/client/${token}` : null,
    };
  }

  // ================================================================= staff: links

  async createLink(dto: any, user: any, origin?: string) {
    const projectId = dto.project_id;
    const [project] = await this.select('SELECT id, name FROM projects WHERE id = ? AND deleted_at IS NULL', [projectId]);
    if (!project) throw new NotFoundException('Project not found');
    const purpose: Purpose = PURPOSES.includes(dto.purpose) ? dto.purpose : 'project_view';
    let targetId: string | null = dto.target_id || null;

    // Pick a sensible target when none was chosen.
    if (!targetId && purpose === 'boq_approval') {
      const [b] = await this.select(
        `SELECT id FROM boqs WHERE project_id = ? AND deleted_at IS NULL
          ORDER BY FIELD(status, 'awaiting_approval', 'draft', 'in_progress', 'returned', 'approved', 'final'), updated_at DESC LIMIT 1`,
        [projectId],
      );
      if (!b) throw new BadRequestException('This project has no BOQ to approve yet.');
      targetId = b.id;
    }
    if (!targetId && purpose === 'quotation_selection') {
      const [c] = await this.select(
        'SELECT id FROM quotation_comparisons WHERE projectId = ? ORDER BY updatedAt DESC LIMIT 1',
        [projectId],
      );
      if (!c) throw new BadRequestException('Save a quotation comparison for this project first.');
      targetId = c.id;
    }

    const days = Math.min(Math.max(Number(dto.expires_days) || 30, 1), 180);
    const token = randomBytes(24).toString('base64url');
    const id = randomUUID();
    const expires = new Date(Date.now() + days * 86_400_000);
    await this.exec(
      `INSERT INTO client_links (id, token_hash, token_hint, token_enc, project_id, purpose, target_id, client_name, client_email, options_json, expires_at, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        id,
        sha(token),
        token.slice(0, 6),
        encrypt(token),
        projectId,
        purpose,
        targetId,
        dto.client_name || null,
        dto.client_email ? String(dto.client_email).trim().toLowerCase() : null,
        JSON.stringify(dto.options || {}),
        expires,
        user?.id || null,
      ],
    );
    const [row] = await this.select(
      `SELECT l.*, p.name project_name, u.name created_by_name FROM client_links l
         JOIN projects p ON p.id = l.project_id LEFT JOIN users u ON u.id = l.created_by WHERE l.id = ?`,
      [id],
    );
    return this.linkOut(row, origin);
  }

  async listLinks(projectId: string | undefined, origin?: string) {
    const rows = await this.select(
      `SELECT l.*, p.name project_name, u.name created_by_name FROM client_links l
         JOIN projects p ON p.id = l.project_id LEFT JOIN users u ON u.id = l.created_by
        ${projectId ? 'WHERE l.project_id = ?' : ''} ORDER BY l.created_at DESC LIMIT 200`,
      projectId ? [projectId] : [],
    );
    return rows.map((r) => this.linkOut(r, origin));
  }

  async revokeLink(id: string, user: any) {
    const [l] = await this.select('SELECT id FROM client_links WHERE id = ?', [id]);
    if (!l) throw new NotFoundException('Link not found');
    await this.exec('UPDATE client_links SET revoked_at = NOW(), revoked_by = ? WHERE id = ? AND revoked_at IS NULL', [
      user?.id || null,
      id,
    ]);
    return { id, state: 'revoked' };
  }

  async responses(projectId: string) {
    const rows = await this.select(
      `SELECT r.id, r.kind, r.target_id, r.signatory_name, r.signatory_email, r.comments, r.data_json, r.created_at, l.purpose
         FROM client_link_responses r JOIN client_links l ON l.id = r.link_id
        WHERE r.project_id = ? ORDER BY r.created_at DESC`,
      [projectId],
    );
    return rows.map((r) => ({ ...r, data: j(r.data_json, {}), data_json: undefined }));
  }

  // ================================================================= signed-in client home

  async clientHome(user: any, origin?: string) {
    const email = String(user?.email || '').toLowerCase();
    const projects = await this.select(
      `SELECT p.id, p.name, p.site_location AS location, pt.name AS project_type, p.current_phase AS phase,
              ROUND(COALESCE(p.progress_pct, 0)) AS progress, p.status
         FROM projects p
         JOIN clients c ON c.id = p.client_id AND c.deleted_at IS NULL
         LEFT JOIN project_types pt ON pt.id = p.project_type_id
        WHERE p.deleted_at IS NULL AND LOWER(c.email) = ?
        ORDER BY p.updated_at DESC`,
      [email],
    );
    const links = await this.select(
      `SELECT l.*, p.name project_name FROM client_links l JOIN projects p ON p.id = l.project_id
        WHERE l.revoked_at IS NULL AND l.expires_at > NOW()
          AND (LOWER(l.client_email) = ? ${projects.length ? `OR l.project_id IN (${projects.map(() => '?').join(',')})` : ''})
        ORDER BY l.created_at DESC`,
      [email, ...projects.map((p) => p.id)],
    );
    return {
      user: { id: user?.id, name: user?.name, email: user?.email },
      projects: projects.map((p) => ({ ...p, phase: this.phaseLabel(p.phase) })),
      magic_links: links.map((l) => this.linkOut(l, origin)).filter((l) => l.token),
    };
  }

  // ================================================================= public (token)

  private async resolve(token: string, opts: { touch?: boolean } = {}) {
    if (!token || token.length < 16) throw fail(404, 'This link is not valid.');
    const [l] = await this.select(
      `SELECT l.*, p.name project_name FROM client_links l JOIN projects p ON p.id = l.project_id AND p.deleted_at IS NULL
        WHERE l.token_hash = ?`,
      [sha(token)],
    );
    if (!l) throw fail(404, 'This link is not valid.');
    if (l.revoked_at) throw fail(410, 'This link has been withdrawn. Please ask the Rippotai team for a new one.');
    if (new Date(l.expires_at).getTime() < Date.now()) throw fail(410, 'This link has expired. Please ask the Rippotai team for a new one.');
    if (opts.touch)
      await this.exec('UPDATE client_links SET open_count = open_count + 1, last_opened_at = NOW() WHERE id = ?', [l.id]);
    return { ...l, options: j(l.options_json, {}) };
  }

  private phaseLabel(code: string | null) {
    if (!code) return null;
    return titleCase(String(code).replace(/^\d+_/, '').replace(/_/g, ' '));
  }

  private async phases(project: any) {
    const rows = await this.select(
      `SELECT phase_code, title, sort_order FROM project_phases WHERE module = 'DOCUMENTS' AND deleted_at IS NULL
          AND phase_code REGEXP '^[0-9]' ORDER BY sort_order, phase_code`,
    );
    const idx = rows.findIndex((r) => r.phase_code === project.current_phase);
    return rows.map((r, i) => ({
      phase_code: r.phase_code,
      name: titleCase(String(r.title).replace(/^\d+\s*/, '')),
      status: idx < 0 ? 'pending' : i < idx ? 'completed' : i === idx ? 'in_progress' : 'pending',
    }));
  }

  private linkPublic(l: any) {
    return {
      purpose: l.purpose,
      target_id: l.target_id,
      client_name: l.client_name,
      client_email: l.client_email,
      expires_at: l.expires_at,
      options: l.options,
    };
  }

  async publicLanding(token: string) {
    const l = await this.resolve(token, { touch: true });
    const [p] = await this.select(
      `SELECT p.id, p.name, p.site_location AS location, pt.name AS project_type, p.current_phase,
              ROUND(COALESCE(p.progress_pct, 0)) AS progress, p.expected_completion_date
         FROM projects p LEFT JOIN project_types pt ON pt.id = p.project_type_id WHERE p.id = ?`,
      [l.project_id],
    );
    const upcoming = await this.select(
      `SELECT title AS name, DATE_FORMAT(due_date, '%d %b %Y') AS planned_end FROM milestones
        WHERE project_id = ? AND deleted_at IS NULL AND status IN ('PENDING','IN_PROGRESS') AND due_date >= CURDATE()
        ORDER BY due_date LIMIT 5`,
      [l.project_id],
    );
    const documents = await this.select(
      `SELECT id, COALESCE(NULLIF(title, ''), filename) AS name, category, created_at AS uploaded_at
         FROM documents WHERE project_id = ? AND visibility IN ('client','external','public') ORDER BY created_at DESC LIMIT 30`,
      [l.project_id],
    );
    return {
      link: this.linkPublic(l),
      project: { ...p, phase: this.phaseLabel(p.current_phase) },
      phases: await this.phases(p),
      upcoming_milestones: upcoming,
      documents,
    };
  }

  async publicBoq(token: string, boqId: string) {
    const l = await this.resolve(token);
    if (l.target_id && l.target_id !== boqId && l.purpose === 'boq_approval') throw fail(403, 'This link is for a different BOQ.');
    const [b] = await this.select(
      `SELECT b.*, p.name project_name FROM boqs b JOIN projects p ON p.id = b.project_id
        WHERE b.id = ? AND b.project_id = ? AND b.deleted_at IS NULL`,
      [boqId, l.project_id],
    );
    if (!b) throw fail(404, 'BOQ not found.');
    const showRates = l.options?.show_rates !== false;
    const items = await this.select(
      `SELECT i.id, i.name AS description, COALESCE(i.unit, u.code, u.name) AS unit, i.quantity, i.rate, i.amount, c.name AS category
         FROM boq_items i JOIN boq_categories c ON c.id = i.boq_category_id LEFT JOIN units u ON u.id = i.unit_id
        WHERE c.boq_id = ? AND COALESCE(i.hidden, 0) = 0 ORDER BY c.sort_order, i.sort_order`,
      [boqId],
    );
    const [done] = await this.select(
      `SELECT kind, signatory_name, created_at FROM client_link_responses WHERE target_id = ? AND kind IN ('boq_approved','boq_changes_requested')
        ORDER BY created_at DESC LIMIT 1`,
      [boqId],
    );
    return {
      id: b.id,
      title: b.title,
      boq_number: b.boq_number,
      project_name: b.project_name,
      version: b.version,
      status: String(b.status).replace(/_/g, ' '),
      total_amount: Number(b.total_value || 0) || items.reduce((s, i) => s + Number(i.amount || 0), 0),
      items: items.map((i) => ({
        ...i,
        quantity: Number(i.quantity),
        rate: showRates ? Number(i.rate) : null,
        amount: Number(i.amount),
      })),
      last_response: done || null,
    };
  }

  private async notifyStaff(projectId: string, title: string, message: string, entityType: string, entityId: string) {
    const users = await this.select<{ id: string }>(
      `SELECT DISTINCT u.id FROM users u LEFT JOIN roles r ON r.id = u.role_id
        WHERE u.is_active = 1 AND (r.name = 'ADMIN' OR u.job_title LIKE '%Project Manager%'
           OR u.id IN (SELECT user_id FROM team_members WHERE owner_type = 'PROJECT' AND owner_id = ? AND deleted_at IS NULL))`,
      [projectId],
    );
    if (!users.length) return;
    await this.notifications.createMany(
      users.map((u) => ({
        user_id: u.id,
        type: NotificationType.SYSTEM,
        title: title.slice(0, 255),
        message,
        entity_type: entityType,
        entity_id: entityId,
      })) as any,
    );
  }

  private async respond(l: any, kind: string, targetId: string | null, body: any, data: any = {}) {
    const id = randomUUID();
    await this.exec(
      `INSERT INTO client_link_responses (id, link_id, project_id, kind, target_id, signatory_name, signatory_email, comments, data_json, signature_png, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        id,
        l.id,
        l.project_id,
        kind,
        targetId,
        String(body.signatory_name || l.client_name || '').slice(0, 255) || null,
        body.signatory_email || l.client_email || null,
        body.comments || null,
        JSON.stringify(data),
        typeof body.signature_png === 'string' && body.signature_png.length < 600_000 ? body.signature_png : null,
      ],
    );
    return id;
  }

  async publicBoqDecision(token: string, boqId: string, body: any) {
    const l = await this.resolve(token);
    if (l.purpose !== 'boq_approval') throw fail(403, 'This link cannot be used to approve a BOQ.');
    const boq = await this.publicBoq(token, boqId);
    if (!String(body.signatory_name || '').trim()) throw fail(400, 'Signatory name is required.');
    const approved = !!body.approved && !body.request_changes;
    if (!approved && !String(body.comments || '').trim()) throw fail(400, 'Please say what needs to change.');
    const id = await this.respond(l, approved ? 'boq_approved' : 'boq_changes_requested', boqId, body, { total: boq.total_amount });
    if (approved) {
      await this.exec(`UPDATE boqs SET status = 'approved', approved_at = NOW(), updated_at = NOW() WHERE id = ?`, [boqId]);
    } else {
      await this.exec(`UPDATE boqs SET status = 'returned', updated_at = NOW() WHERE id = ?`, [boqId]);
    }
    await this.notifyStaff(
      l.project_id,
      approved ? `Client approved BOQ ${boq.boq_number || ''}`.trim() : `Client requested BOQ changes`,
      `${l.project_name}: ${body.signatory_name}${body.comments ? ` — “${body.comments}”` : ''}`,
      'boq',
      boqId,
    );
    return { id, approved };
  }

  async publicCompare(token: string, cid: string) {
    const l = await this.resolve(token);
    const [c] = await this.select('SELECT * FROM quotation_comparisons WHERE id = ? AND projectId = ?', [cid, l.project_id]);
    if (!c) throw fail(404, 'Comparison not found.');
    const ids: string[] = j(c.quotationIds, []);
    const quotes = ids.length
      ? await this.select(
          `SELECT q.id, q.total_amount AS totalAmount, q.is_selected AS isSelected, q.validity_days AS validityDays, v.name vendor_name, v.company_name
             FROM quotations q LEFT JOIN vendors v ON v.id = q.vendor_id
            WHERE q.id IN (${ids.map(() => '?').join(',')}) AND q.deleted_at IS NULL`,
          ids,
        )
      : [];
    const showNames = l.options?.show_vendor_names !== false;
    const [p] = await this.select('SELECT name FROM projects WHERE id = ?', [l.project_id]);
    return {
      link: this.linkPublic(l),
      comparison: { id: c.id, name: c.name, work_category: c.workCategory, project_name: p?.name },
      quotations: quotes.map((q, i) => ({
        id: q.id,
        vendor_name: showNames ? q.company_name || q.vendor_name : `Vendor ${String.fromCharCode(65 + i)}`,
        final_total: Number(q.totalAmount || 0),
        selected: !!q.isSelected,
        validity_days: q.validityDays,
      })),
    };
  }

  async publicSelectQuote(token: string, body: any) {
    const l = await this.resolve(token);
    if (l.purpose !== 'quotation_selection') throw fail(403, 'This link cannot be used to select a vendor.');
    const data = await this.publicCompare(token, l.target_id);
    if (!data.quotations.some((q) => q.id === body.quotation_id)) throw fail(400, 'Choose one of the quotations shown.');
    if (!String(body.signatory_name || '').trim()) throw fail(400, 'Signatory name is required.');
    const id = await this.respond(l, 'quotation_selected', body.quotation_id, body);
    await this.exec('UPDATE quotations SET is_selected = 0 WHERE id IN (?)', [data.quotations.map((q) => q.id)]);
    await this.exec('UPDATE quotations SET is_selected = 1, selected_at = NOW() WHERE id = ?', [body.quotation_id]);
    const q = data.quotations.find((x) => x.id === body.quotation_id);
    await this.notifyStaff(l.project_id, 'Client selected a vendor', `${l.project_name}: ${q?.vendor_name} chosen by ${body.signatory_name}`, 'quotation', body.quotation_id);
    return { id };
  }

  async publicHandover(token: string) {
    const l = await this.resolve(token);
    const [p] = await this.select('SELECT id, name FROM projects WHERE id = ?', [l.project_id]);
    const status = await this.handoverStatus(l.project_id);
    return { link: this.linkPublic(l), project: p, checklist: status.checklist, package: status.package, accepted: status.accepted };
  }

  async publicHandoverAccept(token: string, body: any) {
    const l = await this.resolve(token);
    if (l.purpose !== 'handover_acceptance') throw fail(403, 'This link cannot be used to accept the handover.');
    if (!String(body.signatory_name || '').trim()) throw fail(400, 'Signatory name is required.');
    const id = await this.respond(l, 'handover_accepted', l.project_id, body);
    await this.notifyStaff(l.project_id, 'Client accepted the handover', `${l.project_name}: signed by ${body.signatory_name}`, 'project', l.project_id);
    return { id };
  }

  async publicSnag(token: string, body: any) {
    const l = await this.resolve(token);
    if (!String(body.title || '').trim()) throw fail(400, 'Please give the concern a title.');
    const taskId = randomUUID();
    const [pm] = await this.select(
      `SELECT u.id FROM users u WHERE u.is_active = 1 AND u.job_title LIKE '%Project Manager%'
        ORDER BY u.id IN (SELECT user_id FROM team_members WHERE owner_type='PROJECT' AND owner_id = ?) DESC LIMIT 1`,
      [l.project_id],
    );
    const [creator] = await this.select(`SELECT created_by FROM client_links WHERE id = ?`, [l.id]);
    await this.exec(
      `INSERT INTO tasks (id, title, description, project_id, created_by, assigned_to, priority, status, start_date, due_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'high', 'todo', NOW(), NOW() + INTERVAL 3 DAY, NOW(), NOW())`,
      [
        taskId,
        `Client snag: ${String(body.title).slice(0, 230)}`,
        [body.location && `Location: ${body.location}`, body.description, `Reported by ${body.signatory_name || l.client_name || 'client'} via client link.`]
          .filter(Boolean)
          .join('\n'),
        l.project_id,
        creator?.created_by || pm?.id || null,
        pm?.id || null,
      ],
    );
    const id = await this.respond(l, 'snag_reported', taskId, body, { title: body.title, location: body.location, description: body.description, task_id: taskId });
    await this.notifyStaff(l.project_id, 'Client reported a snag', `${l.project_name}: ${body.title}`, 'task', taskId);
    return { id, task_id: taskId };
  }

  // ================================================================= handover

  async handoverStatus(projectId: string) {
    const [p] = await this.select('SELECT id, name, current_phase FROM projects WHERE id = ? AND deleted_at IS NULL', [projectId]);
    if (!p) throw new NotFoundException('Project not found');
    const one = async (sql: string, r: any[] = [projectId]) => Number(Object.values((await this.select(sql, r))[0] || { n: 0 })[0] || 0);

    const drawings = await one(`SELECT COUNT(*) FROM drawings WHERE project_id = ? AND status IN ('Approved','For Construction')`);
    const handoverDocs = await one(
      `SELECT COUNT(*) FROM documents d LEFT JOIN document_types t ON t.id = d.document_type_id
        WHERE d.project_id = ? AND (d.category = 'Handover Documents' OR t.phase_code = '09_HANDOVER')`,
    );
    const certificates = await one(
      `SELECT COUNT(*) FROM documents WHERE project_id = ? AND (LOWER(title) LIKE '%certificate%' OR LOWER(filename) LIKE '%certificate%' OR LOWER(title) LIKE '%warrant%' OR LOWER(filename) LIKE '%warrant%')`,
    );
    const qcOpen = await one(
      `SELECT COUNT(*) FROM qc_sign_offs q WHERE q.project_id = ? AND q.result IN ('FAIL','REWORK')
          AND NOT EXISTS (SELECT 1 FROM qc_sign_offs q2 WHERE q2.project_id = q.project_id AND q2.step_id = q.step_id
                          AND q2.trade_team_id <=> q.trade_team_id AND q2.result = 'PASS' AND q2.attempt_number > q.attempt_number)`,
    );
    const rfisOpen = await one(`SELECT COUNT(*) FROM rfis WHERE project_id = ? AND status = 'OPEN'`);
    const snagsOpen = await one(
      `SELECT COUNT(*) FROM tasks WHERE project_id = ? AND title LIKE 'Client snag:%' AND status <> 'completed'`,
    );
    const [pay] = await this.select(
      `SELECT COUNT(*) total, SUM(m.status IN ('PAID','WAIVED')) paid,
              SUM(m.status NOT IN ('PAID','WAIVED') AND m.sort_order < (SELECT MAX(m2.sort_order) FROM payment_schedule_milestones m2 WHERE m2.payment_schedule_id = m.payment_schedule_id)) open_before_final
         FROM payment_schedule_milestones m JOIN payment_schedules s ON s.id = m.payment_schedule_id AND s.deleted_at IS NULL
        WHERE s.project_id = ?`,
      [projectId],
    );
    const boqApproved = await one(`SELECT COUNT(*) FROM boqs WHERE project_id = ? AND status = 'approved' AND deleted_at IS NULL`);

    const payTotal = Number(pay?.total || 0);
    const checklist = [
      { key: 'drawings', name: 'Approved / for-construction drawings issued', done: drawings > 0, detail: `${drawings} drawings`, required: true },
      { key: 'handover_docs', name: 'Handover documents uploaded', done: handoverDocs > 0, detail: `${handoverDocs} documents`, required: true },
      { key: 'certificates', name: 'Completion certificates & warranties', done: certificates > 0, detail: `${certificates} files`, required: false },
      { key: 'boq', name: 'BOQ approved by client', done: boqApproved > 0, detail: boqApproved ? 'Approved' : 'No approved BOQ', required: true },
      { key: 'qc', name: 'No unresolved QC failures', done: qcOpen === 0, detail: qcOpen ? `${qcOpen} open` : 'All clear', required: true },
      { key: 'rfis', name: 'All site RFIs answered', done: rfisOpen === 0, detail: rfisOpen ? `${rfisOpen} open` : 'All clear', required: true },
      { key: 'snags', name: 'Client snags closed', done: snagsOpen === 0, detail: snagsOpen ? `${snagsOpen} open` : 'None open', required: true },
      {
        key: 'payments',
        name: 'Payments cleared up to the handover milestone',
        done: payTotal > 0 && Number(pay?.open_before_final || 0) === 0,
        detail: payTotal ? `${Number(pay?.paid || 0)} of ${payTotal} milestones paid` : 'No payment schedule',
        required: true,
      },
    ];
    const req = checklist.filter((c) => c.required);
    const available = req.filter((c) => c.done).length;
    const [pkg] = await this.select(
      `SELECT h.*, l.token_enc, l.expires_at, l.revoked_at FROM handover_packages h LEFT JOIN client_links l ON l.id = h.link_id
        WHERE h.project_id = ? ORDER BY h.created_at DESC LIMIT 1`,
      [projectId],
    );
    const [accepted] = await this.select(
      `SELECT signatory_name, created_at FROM client_link_responses WHERE project_id = ? AND kind = 'handover_accepted' ORDER BY created_at DESC LIMIT 1`,
      [projectId],
    );
    const token = pkg ? decrypt(pkg.token_enc) : null;
    return {
      project: { id: p.id, name: p.name, phase: this.phaseLabel(p.current_phase) },
      checklist,
      required: req.length,
      available,
      percent: Math.round((available / Math.max(req.length, 1)) * 100),
      ready: available === req.length,
      package: pkg
        ? {
            id: pkg.id,
            filename: pkg.filename,
            size: Number(pkg.size || 0),
            url: pkg.url,
            created_at: pkg.created_at,
            delivered_at: pkg.delivered_at,
            client_url: token && !pkg.revoked_at && new Date(pkg.expires_at) > new Date() ? `${this.frontendBase()}/client/${token}` : null,
          }
        : null,
      accepted: accepted || null,
    };
  }

  async preparePackage(projectId: string, user: any) {
    const status = await this.handoverStatus(projectId);
    if (!status.ready) throw new BadRequestException('Complete the required checklist items before preparing the package.');
    const docs = await this.select(
      `SELECT d.title, d.filename, d.url, d.category, d.version, d.created_at FROM documents d
         LEFT JOIN document_types t ON t.id = d.document_type_id
        WHERE d.project_id = ? AND (d.visibility IN ('client','external','public') OR d.category IN ('Handover Documents','Approvals') OR t.phase_code = '09_HANDOVER')
        ORDER BY d.category, d.title`,
      [projectId],
    );
    const drawings = await this.select(
      `SELECT drawing_number, title, discipline, status, sheet_size, scale FROM drawings
        WHERE project_id = ? AND status IN ('Approved','For Construction') ORDER BY discipline, drawing_number`,
      [projectId],
    );

    const cdnDir = process.env.CDN_UPLOAD_PATH || '/tmp/inos-cdn';
    const localFile = (url: string) => {
      const m = String(url || '').match(/\/cdn\/([^/?#]+)$/);
      if (!m) return null;
      const f = path.join(cdnDir, m[1]);
      return fs.existsSync(f) ? f : null;
    };

    const chunks: Buffer[] = [];
    const zip = archiver('zip', { zlib: { level: 9 } });
    zip.on('data', (c: Buffer) => chunks.push(c));
    const finished = new Promise<void>((res, rej) => {
      zip.on('end', () => res());
      zip.on('error', rej);
    });

    const included: string[] = [];
    const linked: any[] = [];
    for (const d of docs) {
      const f = localFile(d.url);
      const name = `documents/${(d.category || 'Other').replace(/[^\w\- ]+/g, '')}/${d.filename || path.basename(d.url || 'file')}`;
      if (f) {
        zip.file(f, { name });
        included.push(name);
      } else linked.push(d);
    }
    const csv = (rows: any[], cols: string[]) =>
      [cols.join(','), ...rows.map((r) => cols.map((c) => `"${String(r[c] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
    zip.append(csv(drawings, ['drawing_number', 'title', 'discipline', 'status', 'sheet_size', 'scale']), { name: 'drawing-register.csv' });
    zip.append(csv(docs, ['category', 'title', 'filename', 'version', 'url']), { name: 'document-index.csv' });
    zip.append(
      [
        `Handover package — ${status.project.name}`,
        `Prepared ${new Date().toISOString().slice(0, 10)} by ${user?.name || 'Rippotai'} · Rippotai Architecture`,
        '',
        'Checklist',
        ...status.checklist.map((c) => `  [${c.done ? 'x' : ' '}] ${c.name} — ${c.detail}`),
        '',
        `${included.length} files included, ${linked.length} referenced in document-index.csv, ${drawings.length} drawings in drawing-register.csv.`,
      ].join('\n'),
      { name: 'README.txt' },
    );
    await zip.finalize();
    await finished;
    const buffer = Buffer.concat(chunks);
    const slug = String(status.project.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const filename = `${slug}-handover-${new Date().toISOString().slice(0, 10)}.zip`;
    const up = await this.cdn.uploadBuffer(buffer, filename);
    const id = randomUUID();
    await this.exec(
      `INSERT INTO handover_packages (id, project_id, filename, url, size, manifest_json, prepared_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [id, projectId, filename, up.url, buffer.length, JSON.stringify({ included, linked: linked.length, drawings: drawings.length }), user?.id || null],
    );
    return { id, filename, url: up.url, size: buffer.length, files: included.length, referenced: linked.length, drawings: drawings.length };
  }

  async deliver(projectId: string, body: any, user: any, origin?: string) {
    const [pkg] = await this.select('SELECT * FROM handover_packages WHERE project_id = ? ORDER BY created_at DESC LIMIT 1', [projectId]);
    if (!pkg) throw new BadRequestException('Prepare the handover package first.');
    const [client] = await this.select(
      `SELECT c.name, c.contact_person, c.email FROM projects p LEFT JOIN clients c ON c.id = p.client_id WHERE p.id = ?`,
      [projectId],
    );
    const link = await this.createLink(
      {
        project_id: projectId,
        purpose: 'handover_acceptance',
        client_name: body?.client_name || client?.contact_person || client?.name,
        client_email: body?.client_email || client?.email,
        expires_days: body?.expires_days || 30,
      },
      user,
      origin,
    );
    await this.exec('UPDATE handover_packages SET link_id = ?, delivered_at = NOW() WHERE id = ?', [link.id, pkg.id]);
    return { ...link, package: { id: pkg.id, filename: pkg.filename, url: pkg.url } };
  }
}
