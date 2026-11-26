import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { QueryTypes } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { NotificationType } from '@/common/enums';
import { NotificationsService } from '../engagement/notifications.service';
import {
  computePartLevel,
  findPart,
  isLegacyPermission,
  LEVEL_RANK,
} from '../rbac/access-catalogue';
import {
  docType,
  DocType,
  REVIEW_ACTIONS,
  ReviewAction,
  DOC_TYPES,
} from './doc-registry';

export type Actor = {
  id: string;
  name?: string;
  roleName?: string | null;
  permissions?: string[];
};

const ADMIN_ROLES = new Set(['ADMIN', 'SUPERADMIN']);
const SAFE = /^[a-z_]+$/;
const q = (ident: string) => {
  if (!SAFE.test(ident)) throw new Error(`Unsafe identifier ${ident}`);
  return '`' + ident + '`';
};

const ACTION_LABEL: Record<ReviewAction, string> = {
  approve: 'approved',
  revise: 'sent back for revision',
  reject: 'rejected',
  archive: 'archived',
};

@Injectable()
export class DocFlowService {
  private readonly logger = new Logger(DocFlowService.name);
  private owned = new Map<string, { at: number; perms: string[] }>();
  private children = new Map<
    string,
    { table: string; fk: string; via?: string }[]
  >();

  constructor(
    private readonly sequelize: Sequelize,
    private readonly notifications: NotificationsService,
  ) {}

  type(key: string): DocType {
    const d = docType(key);
    if (!d) throw new BadRequestException('Unknown document type.');
    return d;
  }

  /* ------------------------------------------------------------ access */

  private async ownedPermissions(partKey: string) {
    const hit = this.owned.get(partKey);
    if (hit && Date.now() - hit.at < 60_000) return hit.perms;
    const part = findPart(partKey);
    const resources = part?.resources ?? [];
    const rows: { resource: string; action: string }[] = resources.length
      ? await this.sequelize.query(
          'SELECT resource, action FROM permissions WHERE resource IN (:resources)',
          { replacements: { resources }, type: QueryTypes.SELECT },
        )
      : [];
    const perms = [
      ...rows
        .filter((r) => !isLegacyPermission(r.resource, r.action))
        .map((r) => `${r.resource}:${r.action}`),
      ...(part?.permissions ?? []),
    ];
    this.owned.set(partKey, { at: Date.now(), perms });
    return perms;
  }

  async levelOf(actor: Actor, d: DocType) {
    if (ADMIN_ROLES.has(String(actor.roleName ?? '').toUpperCase()))
      return 'full';
    const owned = await this.ownedPermissions(d.part);
    return computePartLevel(owned, new Set(actor.permissions ?? [])).level;
  }

  async canReview(actor: Actor, d: DocType) {
    return (await this.levelOf(actor, d)) === 'full';
  }

  private async assertRead(actor: Actor, d: DocType) {
    if (LEVEL_RANK[await this.levelOf(actor, d)] < LEVEL_RANK.view)
      throw new ForbiddenException(`No access to ${d.label}.`);
  }

  /* ------------------------------------------------------------ rows */

  private async row(d: DocType, id: string) {
    const [row] = await this.sequelize.query<any>(
      `SELECT * FROM ${q(d.table)} WHERE id = :id LIMIT 1`,
      { replacements: { id }, type: QueryTypes.SELECT },
    );
    return row;
  }

  private async childTables(table: string) {
    if (this.children.has(table)) return this.children.get(table)!;
    const rows: { table_name: string; column_name: string }[] =
      await this.sequelize.query(
        `SELECT TABLE_NAME AS table_name, COLUMN_NAME AS column_name
           FROM information_schema.KEY_COLUMN_USAGE
          WHERE TABLE_SCHEMA = DATABASE() AND REFERENCED_TABLE_NAME = :table
            AND REFERENCED_COLUMN_NAME = 'id'`,
        { replacements: { table }, type: QueryTypes.SELECT },
      );
    // Other documents and history/log tables that merely point at this one are not
    // part of its content (a BOQ's comparisons, estimates, versions, activity…).
    const docTables = new Set(DOC_TYPES.map((t) => t.table));
    const history =
      /(_versions|_activities|_activity|_logs|_revisions|_reviews)$/;
    const declared = DOC_TYPES.find((t) => t.table === table)?.children ?? [];
    const list: { table: string; fk: string; via?: string }[] = [
      ...rows
        .filter((r) => SAFE.test(r.table_name) && SAFE.test(r.column_name))
        .filter(
          (r) =>
            !docTables.has(r.table_name) &&
            !history.test(r.table_name) &&
            r.table_name !== 'budget_estimates',
        )
        .map((r) => ({ table: r.table_name, fk: r.column_name })),
      ...declared.filter(
        (c) =>
          SAFE.test(c.table) &&
          SAFE.test(c.fk) &&
          (!c.via || SAFE.test(c.via)) &&
          !rows.some((r) => r.table_name === c.table && !c.via),
      ),
    ];
    // direct children first, then rows one level down (`via`)
    list.sort((a, b) => Number(!!a.via) - Number(!!b.via));
    this.children.set(table, list);
    return list;
  }

  /* ------------------------------------------------------------ reviews */

  async listReviews(actor: Actor, type: string, entityId: string) {
    const d = this.type(type);
    await this.assertRead(actor, d);
    const reviews = await this.sequelize.query(
      `SELECT r.id, r.action, r.comment, r.version, r.created_at,
              r.user_id, u.name AS user_name
         FROM document_reviews r LEFT JOIN users u ON u.id = r.user_id
        WHERE r.entity_type = :type AND r.entity_id = :entityId
        ORDER BY r.created_at DESC`,
      { replacements: { type, entityId }, type: QueryTypes.SELECT },
    );
    const revisions = await this.sequelize.query(
      `SELECT s.id, s.version, s.created_at, s.user_id, u.name AS user_name
         FROM document_snapshots s LEFT JOIN users u ON u.id = s.user_id
        WHERE s.entity_type = :type AND s.entity_id = :entityId
        ORDER BY s.version DESC, s.created_at DESC`,
      { replacements: { type, entityId }, type: QueryTypes.SELECT },
    );
    const meta = (await this.meta(actor, type, [entityId]))[entityId];
    return {
      reviews,
      revisions,
      state: meta ?? null,
      canReview: await this.canReview(actor, d),
    };
  }

  async revision(actor: Actor, type: string, snapshotId: string) {
    const d = this.type(type);
    await this.assertRead(actor, d);
    const [row] = await this.sequelize.query<any>(
      `SELECT id, entity_id, version, data, created_at FROM document_snapshots
        WHERE id = :snapshotId AND entity_type = :type`,
      { replacements: { snapshotId, type }, type: QueryTypes.SELECT },
    );
    if (!row) throw new NotFoundException('Revision not found.');
    const data = JSON.parse(row.data || '{}');
    if (type !== 'procurement-sheet') return { ...row, data };

    const { procurement_after: saved, ...snapshot } = data;
    const replacements = { type, id: row.entity_id, version: row.version };
    const [next] = saved
      ? []
      : await this.sequelize.query<any>(
          `SELECT data FROM document_snapshots
        WHERE entity_type = :type AND entity_id = :id AND version > :version
        ORDER BY version ASC LIMIT 1`,
          { replacements, type: QueryTypes.SELECT },
        );
    const nextData = next && JSON.parse(next.data || '{}');
    const items: any[] =
      saved?.items ??
      (nextData
        ? (nextData.material_procurement_items ?? [])
        : await this.sequelize.query<any>(
            `SELECT i.*, p.sheets FROM material_procurement_items i
           JOIN material_procurements p ON p.id = i.procurement_id
           WHERE i.procurement_id = :id`,
            { replacements: { id: row.entity_id }, type: QueryTypes.SELECT },
          ));
    const materialIds = [
      ...new Set(
        items
          .map((item) =>
            item.materialMaster ? null : (item.materialId ?? item.material_id),
          )
          .filter(Boolean),
      ),
    ];
    const materials = materialIds.length
      ? await this.sequelize.query<any>(
          'SELECT id, name, category, material_code FROM material_masters WHERE id IN (:materialIds)',
          { replacements: { materialIds }, type: QueryTypes.SELECT },
        )
      : [];
    return {
      ...row,
      data: snapshot,
      procurementComparison: {
        items,
        materials,
        sheets:
          saved?.sheets ??
          nextData?.material_procurements?.sheets ??
          items[0]?.sheets,
      },
    };
  }

  async review(
    actor: Actor,
    body: {
      entity_type?: string;
      entity_id?: string;
      action?: string;
      comment?: string;
    },
  ) {
    const d = this.type(String(body.entity_type ?? ''));
    const action = String(body.action ?? '') as ReviewAction;
    if (!REVIEW_ACTIONS.includes(action))
      throw new BadRequestException('Unknown review action.');
    const comment = String(body.comment ?? '').trim();
    if ((action === 'revise' || action === 'reject') && !comment)
      throw new BadRequestException('A comment is required.');
    if (comment.length > 4000)
      throw new BadRequestException('Comment is too long.');
    if (!(await this.canReview(actor, d)))
      throw new ForbiddenException(
        `Only reviewers of ${d.label} (Full access) can review it.`,
      );
    const entityId = String(body.entity_id ?? '');
    const row = entityId ? await this.row(d, entityId) : undefined;
    if (!row) throw new NotFoundException(`${d.label} not found.`);
    const version = (await this.versionOf(d, row)) ?? null;
    const projectId = d.projectCol ? (row[d.projectCol] ?? null) : null;

    await this.sequelize.transaction(async (transaction) => {
      await this.sequelize.query(
        `INSERT INTO document_reviews
           (id, entity_type, entity_id, project_id, action, comment, version, user_id, created_at)
         VALUES (:id, :type, :entityId, :projectId, :action, :comment, :version, :userId, NOW())`,
        {
          replacements: {
            id: randomUUID(),
            type: d.key,
            entityId,
            projectId,
            action,
            comment: comment || null,
            version,
            userId: actor.id,
          },
          transaction,
        },
      );
      const map = d.statusMap?.[action];
      if (d.statusCol && map) {
        const { to, from, set } =
          typeof map === 'string'
            ? { to: map, from: undefined, set: undefined }
            : map;
        const current = row[d.statusCol];
        if (!from || from.includes(current)) {
          const extra = Object.entries(set ?? {})
            .map(
              ([col, v]) =>
                `, ${q(col)} = ${v === 'now' ? 'NOW()' : ':userId'}`,
            )
            .join('');
          await this.sequelize.query(
            `UPDATE ${q(d.table)} SET ${q(d.statusCol)} = :to${extra} WHERE id = :entityId`,
            { replacements: { to, entityId, userId: actor.id }, transaction },
          );
        }
      }
    });

    const owner = d.ownerCol ? row[d.ownerCol] : null;
    if (owner && owner !== actor.id)
      this.notifications
        .create({
          user_id: owner,
          type: NotificationType.SYSTEM,
          entity_type: d.key,
          entity_id: entityId,
          title: `${d.label} ${ACTION_LABEL[action]}`,
          message: `${actor.name || 'A reviewer'} ${ACTION_LABEL[action]} your ${d.label}${comment ? `: ${comment.slice(0, 400)}` : '.'}`,
        } as any)
        .catch((e) =>
          this.logger.warn(`Review notification failed: ${e.message}`),
        );

    return this.listReviews(actor, d.key, entityId);
  }

  /* ------------------------------------------------------------ meta */

  private async versionOf(d: DocType, row: any): Promise<number | undefined> {
    if (d.versionCol && row?.[d.versionCol] != null) {
      const n = parseInt(String(row[d.versionCol]).replace(/^v/i, ''), 10);
      if (Number.isFinite(n)) return n;
    }
    if (d.projectLevel) return undefined;
    const [r] = await this.sequelize.query<any>(
      `SELECT COALESCE(MAX(version), 0) AS v FROM document_snapshots
        WHERE entity_type = :type AND entity_id = :id`,
      { replacements: { type: d.key, id: row.id }, type: QueryTypes.SELECT },
    );
    return Number(r?.v ?? 0) + 1;
  }

  /**
   * Review state, version and revision count for every document of a type
   * (or the given ids). State: the latest review action, or "revised" when a
   * newer version was saved after it.
   */
  async meta(actor: Actor, type: string, ids?: string[]) {
    const d = this.type(type);
    await this.assertRead(actor, d);
    const filter = ids?.length ? 'AND entity_id IN (:ids)' : '';
    const reviews: any[] = await this.sequelize.query(
      `SELECT r.entity_id, r.action, r.comment, r.created_at, u.name AS user_name, c.n
         FROM document_reviews r
         JOIN (SELECT entity_id, MAX(created_at) AS at, COUNT(*) AS n
                 FROM document_reviews WHERE entity_type = :type ${filter}
                GROUP BY entity_id) c
           ON c.entity_id = r.entity_id AND c.at = r.created_at
         LEFT JOIN users u ON u.id = r.user_id
        WHERE r.entity_type = :type`,
      { replacements: { type, ids }, type: QueryTypes.SELECT },
    );
    const snaps: any[] = await this.sequelize.query(
      `SELECT entity_id, COUNT(*) AS n, MAX(version) AS v, MAX(created_at) AS at
         FROM document_snapshots WHERE entity_type = :type ${filter}
        GROUP BY entity_id`,
      { replacements: { type, ids }, type: QueryTypes.SELECT },
    );
    const out: Record<string, any> = {};
    const entry = (id: string) =>
      (out[id] ??= { reviews: 0, revisions: 0, state: null });
    for (const s of snaps) {
      const e = entry(s.entity_id);
      e.revisions = Number(s.n);
      e.snapshotVersion = Number(s.v) + 1;
      e.savedAt = s.at;
    }
    for (const r of reviews) {
      const e = entry(r.entity_id);
      e.reviews = Number(r.n);
      e.last = {
        action: r.action,
        comment: r.comment,
        at: r.created_at,
        by: r.user_name,
      };
      e.state = r.action;
      if (
        r.action !== 'archive' &&
        e.savedAt &&
        new Date(e.savedAt) > new Date(r.created_at)
      )
        e.state = 'revised';
    }
    return out;
  }

  async capabilities(actor: Actor, type: string) {
    const d = this.type(type);
    const level = await this.levelOf(actor, d);
    return { level, canReview: level === 'full' };
  }

  /** Minimal rows for document types without a flat list API. */
  async rows(actor: Actor, type: string) {
    const d = this.type(type);
    await this.assertRead(actor, d);
    const where = [
      d.rowsWhere,
      d.deletedCol && !d.rowsWhere ? `${q(d.deletedCol)} IS NULL` : null,
    ].filter(Boolean);
    const name = d.projectLevel ? 'name' : d.nameCol ? q(d.nameCol) : 'NULL';
    const project = d.projectCol ? q(d.projectCol) : 'NULL';
    const status = d.statusCol ? q(d.statusCol) : 'NULL';
    const owner = d.ownerCol ? q(d.ownerCol) : 'NULL';
    const updated = d.projectLevel
      ? 'updated_at'
      : `COALESCE(updated_at, created_at)`;
    return this.sequelize.query(
      `SELECT id, ${project} AS project_id, ${name} AS name, ${status} AS status,
              ${owner} AS owner_id, ${updated} AS updated_at
         FROM ${q(d.table)} ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
        ORDER BY updated_at DESC LIMIT 2000`,
      { type: QueryTypes.SELECT },
    );
  }

  /** Latest saved document of a type for a project (refill on create). */
  async existing(actor: Actor, type: string, projectId: string) {
    const d = this.type(type);
    await this.assertRead(actor, d);
    if (!projectId || !d.projectCol || d.projectLevel) return { id: null };
    const order =
      d.versionChain && d.versionCol ? `${q(d.versionCol)} DESC,` : '';
    const rows: any[] = await this.sequelize.query(
      `SELECT id FROM ${q(d.table)}
        WHERE ${q(d.projectCol)} = :projectId
          ${d.deletedCol ? `AND ${q(d.deletedCol)} IS NULL` : ''}
          ${d.statusCol ? `AND COALESCE(LOWER(${q(d.statusCol)}), '') NOT IN ('archived', 'cancelled')` : ''}
          AND id NOT IN (SELECT r.entity_id FROM document_reviews r
                          JOIN (SELECT entity_id, MAX(created_at) at FROM document_reviews
                                 WHERE entity_type = :type GROUP BY entity_id) l
                            ON l.entity_id = r.entity_id AND l.at = r.created_at
                         WHERE r.entity_type = :type AND r.action = 'archive')
        ORDER BY ${order} updated_at DESC LIMIT 1`,
      { replacements: { projectId, type }, type: QueryTypes.SELECT },
    );
    return { id: rows[0]?.id ?? null };
  }

  /* ------------------------------------------------------------ snapshots */

  /** Captures the current state of a document before a save (called by the interceptor). */
  async captureBefore(
    d: DocType,
    key: string,
    by: 'id' | 'project' | 'child' = 'id',
    child?: { table: string; parentCol: string },
  ) {
    if (by === 'child') {
      if (!child || !SAFE.test(child.table) || !SAFE.test(child.parentCol))
        return undefined;
      const [link] = await this.sequelize.query<any>(
        `SELECT ${q(child.parentCol)} AS pid FROM ${q(child.table)} WHERE id = :key LIMIT 1`,
        { replacements: { key }, type: QueryTypes.SELECT },
      );
      if (!link?.pid) return undefined;
      key = link.pid;
      by = 'id';
    }
    const where =
      by === 'project' && d.projectCol
        ? `${q(d.projectCol)} = :key ${d.deletedCol ? `AND ${q(d.deletedCol)} IS NULL` : ''} ORDER BY updated_at DESC`
        : 'id = :key';
    const [row] = await this.sequelize.query<any>(
      `SELECT * FROM ${q(d.table)} WHERE ${where} LIMIT 1`,
      { replacements: { key }, type: QueryTypes.SELECT },
    );
    if (!row) return undefined;
    const data: Record<string, any> = { [d.table]: row };
    for (const c of await this.childTables(d.table)) {
      if (c.via) {
        const parents = ((data[c.via] as any[]) || [])
          .map((p) => p.id)
          .filter(Boolean);
        data[c.table] = parents.length
          ? await this.sequelize.query(
              `SELECT * FROM ${q(c.table)} WHERE ${q(c.fk)} IN (:parents) LIMIT 5000`,
              { replacements: { parents }, type: QueryTypes.SELECT },
            )
          : [];
        continue;
      }
      data[c.table] = await this.sequelize.query(
        `SELECT * FROM ${q(c.table)} WHERE ${q(c.fk)} = :id LIMIT 2000`,
        { replacements: { id: row.id }, type: QueryTypes.SELECT },
      );
    }
    return { row, data };
  }

  /** Stores the captured state as the previous version; one per minute per document. */
  async commitSnapshot(
    d: DocType,
    captured: { row: any; data: any },
    actor?: Actor,
    force = false,
  ) {
    const { row, data } = captured;
    const [recent] = force
      ? []
      : await this.sequelize.query<any>(
          `SELECT id FROM document_snapshots
        WHERE entity_type = :type AND entity_id = :id
          AND created_at > NOW() - INTERVAL 60 SECOND LIMIT 1`,
          {
            replacements: { type: d.key, id: row.id },
            type: QueryTypes.SELECT,
          },
        );
    if (recent) return;
    const version = (await this.versionOf(d, row)) ?? 1;
    await this.sequelize.query(
      `INSERT INTO document_snapshots
         (id, entity_type, entity_id, project_id, version, data, user_id, created_at)
       VALUES (:id, :type, :entityId, :projectId, :version, :data, :userId, NOW())`,
      {
        replacements: {
          id: randomUUID(),
          type: d.key,
          entityId: row.id,
          projectId: d.projectCol ? (row[d.projectCol] ?? null) : null,
          version,
          data: JSON.stringify(data),
          userId: actor?.id ?? null,
        },
      },
    );
    if (d.bumpVersion && d.versionCol) {
      const col = q(d.versionCol);
      if (d.versionChain && d.projectCol)
        await this.sequelize.query(
          `UPDATE ${q(d.table)} t
             JOIN (SELECT COALESCE(MAX(${col}), 0) + 1 AS nv FROM ${q(d.table)}
                    WHERE ${q(d.projectCol)} = :projectId) m
              SET t.${col} = GREATEST(m.nv, :next) WHERE t.id = :id`,
          {
            replacements: {
              projectId: row[d.projectCol],
              next: version + 1,
              id: row.id,
            },
          },
        );
      else
        await this.sequelize.query(
          `UPDATE ${q(d.table)} SET ${col} = :next WHERE id = :id`,
          { replacements: { next: version + 1, id: row.id } },
        );
    }
  }

  /* ------------------------------------------------------------ restore */

  /**
   * Make an earlier version current again: the present state is kept as a new
   * revision first, then the document row and its child rows (items, lines…)
   * are put back as they were in the snapshot. Rows added after that version
   * are removed when nothing else depends on them. All or nothing.
   */
  async restore(actor: Actor, type: string, snapshotId: string) {
    const d = this.type(type);
    if (LEVEL_RANK[await this.levelOf(actor, d)] < LEVEL_RANK.edit)
      throw new ForbiddenException(`You can view but not edit ${d.label}.`);
    const snap = await this.revision(actor, type, snapshotId);
    const data: Record<string, any> = snap.data || {};
    const main = data[d.table];
    if (!main?.id)
      throw new BadRequestException(
        'This revision has no saved data to restore.',
      );
    const current = await this.captureBefore(d, main.id);
    if (!current) throw new NotFoundException(`${d.label} no longer exists.`);

    const ident = /^[A-Za-z0-9_]+$/;
    const bq = (s: string) => {
      if (!ident.test(s)) throw new BadRequestException('Unsafe identifier.');
      return `\`${s}\``;
    };
    const columnsOf = async (table: string) =>
      new Set(
        (
          await this.sequelize.query<{ c: string }>(
            `SELECT COLUMN_NAME AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table`,
            { replacements: { table }, type: QueryTypes.SELECT },
          )
        ).map((r) => r.c),
      );
    const iso = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
    const value = (v: any) => {
      if (v === null || v === undefined) return null;
      if (typeof v === 'string' && iso.test(v))
        return v.replace('T', ' ').replace(/(\.\d+)?Z$/, '');
      if (typeof v === 'object') return JSON.stringify(v);
      return v;
    };
    const KEEP = new Set([
      'id',
      'created_at',
      'createdAt',
      'created_by',
      'deleted_at',
      'deletedAt',
    ]);
    if (d.versionCol) KEEP.add(d.versionCol);

    await this.sequelize.transaction(async (transaction) => {
      // 1. the document row
      const cols = await columnsOf(d.table);
      const sets = Object.keys(main).filter(
        (k) => cols.has(k) && !KEEP.has(k) && ident.test(k),
      );
      const repl: Record<string, any> = { id: main.id };
      sets.forEach((k, i) => (repl[`v${i}`] = value(main[k])));
      if (sets.length)
        await this.sequelize.query(
          `UPDATE ${bq(d.table)} SET ${sets.map((k, i) => `${bq(k)} = :v${i}`).join(', ')} WHERE id = :id`,
          { replacements: repl, transaction },
        );

      // 2. child rows, parents before children (a child table may point at another)
      const children = (await this.childTables(d.table)).filter((c) =>
        Array.isArray(data[c.table]),
      );
      const refs = await this.sequelize.query<{ t: string; r: string }>(
        `SELECT TABLE_NAME AS t, REFERENCED_TABLE_NAME AS r FROM information_schema.KEY_COLUMN_USAGE
          WHERE TABLE_SCHEMA = DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL`,
        { type: QueryTypes.SELECT },
      );
      const dependsOn = (a: string, b: string) =>
        refs.some((x) => x.t === a && x.r === b && a !== b);
      const ordered = [...children].sort(
        (a, b) =>
          Number(!!a.via) - Number(!!b.via) ||
          (dependsOn(a.table, b.table)
            ? 1
            : dependsOn(b.table, a.table)
              ? -1
              : 0),
      );
      for (const c of ordered) {
        const ccols = await columnsOf(c.table);
        const rows: any[] = data[c.table];
        for (const row of rows) {
          const keys = Object.keys(row).filter(
            (k) => ccols.has(k) && ident.test(k),
          );
          if (!keys.includes('id')) continue;
          const rr: Record<string, any> = {};
          keys.forEach((k, i) => (rr[`c${i}`] = value(row[k])));
          await this.sequelize.query(
            `INSERT INTO ${bq(c.table)} (${keys.map(bq).join(', ')}) VALUES (${keys.map((_, i) => `:c${i}`).join(', ')})
             ON DUPLICATE KEY UPDATE ${
               keys
                 .filter((k) => k !== 'id')
                 .map((k) => `${bq(k)} = VALUES(${bq(k)})`)
                 .join(', ') || 'id = id'
             }`,
            { replacements: rr, transaction },
          );
        }
      }
      // rows added after this version: drop them (children first) unless something else still needs them
      for (const c of [...ordered].reverse()) {
        const keep = (data[c.table] as any[]).map((r) => r.id).filter(Boolean);
        let parentIds: string[] = [main.id];
        if (c.via) {
          const viaFk = children.find((x) => x.table === c.via)?.fk;
          if (!viaFk) continue;
          parentIds = (
            await this.sequelize.query<{ id: string }>(
              `SELECT id FROM ${bq(c.via)} WHERE ${bq(viaFk)} = :pid`,
              {
                replacements: { pid: main.id },
                type: QueryTypes.SELECT,
                transaction,
              },
            )
          ).map((x) => x.id);
          if (!parentIds.length) continue;
        }
        const extra = await this.sequelize.query<{ id: string }>(
          `SELECT id FROM ${bq(c.table)} WHERE ${bq(c.fk)} IN (:pids)${keep.length ? ' AND id NOT IN (:keep)' : ''}`,
          {
            replacements: { pids: parentIds, keep },
            type: QueryTypes.SELECT,
            transaction,
          },
        );
        for (const x of extra) {
          try {
            await this.sequelize.query(
              `DELETE FROM ${bq(c.table)} WHERE id = :id`,
              {
                replacements: { id: x.id },
                transaction,
              },
            );
          } catch {
            /* still referenced elsewhere (e.g. an item on a delivery challan) — keep it */
          }
        }
      }
    });

    // the state before the restore becomes a revision of its own (and the version moves on)
    await this.commitSnapshot(d, current, actor, true);
    return { restored: true, entityId: main.id, fromVersion: snap.version };
  }
}
