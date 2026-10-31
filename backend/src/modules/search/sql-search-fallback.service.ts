import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { QueryTypes } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { isSearchAdmin, SearchUserContext } from './search-access';
import { SearchHit } from './interfaces/searchable-document.interface';

interface FallbackSource {
  entity: string;
  /** SELECT list must yield id, title, subtitle, project_id, status, updated_at */
  select: string;
  from: string;
  /** Columns matched with LIKE */
  match: string[];
  /** Optional extra WHERE (soft-delete etc.) */
  where?: string;
  /** Column holding the project id, used to scope non-admin users. */
  projectCol?: string;
  /** Entity is only visible to admins when it has no project scope. */
  adminOnly?: boolean;
}

const SOURCES: FallbackSource[] = [
  {
    entity: 'project',
    select:
      'p.id, p.name AS title, p.site_location AS subtitle, p.id AS project_id, p.status, p.updated_at',
    from: 'projects p',
    match: ['p.name', 'p.site_location', 'p.slug'],
    where: 'p.deleted_at IS NULL',
    projectCol: 'p.id',
  },
  {
    entity: 'client',
    select:
      'c.id, c.name AS title, COALESCE(c.contact_person, c.email) AS subtitle, NULL AS project_id, NULL AS status, c.updated_at',
    from: 'clients c',
    match: ['c.name', 'c.contact_person', 'c.email', 'c.phone'],
    where: 'c.deleted_at IS NULL',
    adminOnly: true,
  },
  {
    entity: 'lead',
    select:
      'l.id, COALESCE(l.deal_name, l.name) AS title, l.company AS subtitle, l.project_id, l.stage AS status, l.updated_at',
    from: 'leads l',
    match: ['l.name', 'l.deal_name', 'l.company', 'l.email', 'l.phone'],
    adminOnly: true,
  },
  {
    entity: 'vendor',
    select:
      'v.id, v.name AS title, v.company_name AS subtitle, NULL AS project_id, v.status, v.updated_at',
    from: 'vendors v',
    match: ['v.name', 'v.company_name', 'v.contact_number'],
    adminOnly: true,
  },
  {
    entity: 'boq',
    select:
      'b.id, COALESCE(b.title, b.boq_number) AS title, b.boq_number AS subtitle, b.project_id, b.status, b.updated_at',
    from: 'boqs b',
    match: ['b.title', 'b.boq_number', 'b.client_name'],
    where: 'b.deleted_at IS NULL',
    projectCol: 'b.project_id',
  },
  {
    entity: 'quotation',
    select:
      'q.id, q.quotation_number AS title, NULL AS subtitle, q.project_id, q.status, q.updated_at',
    from: 'quotations q',
    match: ['q.quotation_number', 'q.boq_reference'],
    where: 'q.deleted_at IS NULL',
    projectCol: 'q.project_id',
  },
  {
    entity: 'budget_estimate',
    select:
      'e.id, COALESCE(e.title, e.estimate_number) AS title, e.estimate_number AS subtitle, e.project_id, e.status, e.updated_at',
    from: 'budget_estimates e',
    match: ['e.title', 'e.estimate_number', 'e.client_name'],
    projectCol: 'e.project_id',
  },
  {
    entity: 'work_order',
    select:
      'w.id, w.wo_id AS title, COALESCE(w.contractor_company_name, w.contractor_name) AS subtitle, w.project_id, w.status, w.updated_at',
    from: 'work_orders w',
    match: [
      'w.wo_id',
      'w.contractor_name',
      'w.contractor_company_name',
      'w.project_name',
    ],
    projectCol: 'w.project_id',
  },
  {
    entity: 'delivery_challan',
    select:
      'd.id, d.challan_number AS title, d.site_address AS subtitle, d.project_id, d.status, d.updatedAt AS updated_at',
    from: 'delivery_challans d',
    match: ['d.challan_number', 'd.site_address'],
    projectCol: 'd.project_id',
  },
  {
    entity: 'site_recce',
    select:
      "s.id, CONCAT('Site recce · ', COALESCE(s.project_name, '')) AS title, s.client_name AS subtitle, s.project_id, NULL AS status, s.updated_at",
    from: 'site_recces s',
    match: ['s.project_name', 's.client_name', 's.site_address'],
    where: 's.deleted_at IS NULL',
    projectCol: 's.project_id',
  },
  {
    entity: 'task',
    select:
      't.id, t.title, NULL AS subtitle, t.project_id, t.status, t.updated_at',
    from: 'tasks t',
    match: ['t.title'],
    projectCol: 't.project_id',
  },
];

/**
 * Database LIKE search used when Elasticsearch is unreachable or has no
 * indices yet, so global search keeps working on installs without ES.
 */
@Injectable()
export class SqlSearchFallbackService {
  constructor(@InjectConnection() private readonly sequelize: Sequelize) {}

  async search(
    q: string,
    user: SearchUserContext,
    opts: { entities?: string[]; limit?: number; projectId?: string } = {},
  ): Promise<SearchHit[]> {
    const term = q.trim();
    if (term.length < 1) return [];
    const admin = isSearchAdmin(user);
    const projectIds = admin ? null : (user.projectIds ?? []);
    if (projectIds && !projectIds.length) return [];
    const limit = Math.min(Math.max(opts.limit ?? 20, 1), 50);
    const like = `%${term.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

    const sources = SOURCES.filter(
      (s) =>
        (!opts.entities?.length || opts.entities.includes(s.entity)) &&
        (admin || (!s.adminOnly && s.projectCol)) &&
        (!opts.projectId || s.projectCol),
    );

    const perSource = await Promise.all(
      sources.map(async (s) => {
        const conds = [
          `(${s.match.map((c) => `${c} LIKE :like`).join(' OR ')})`,
        ];
        if (s.where) conds.push(s.where);
        if (projectIds) conds.push(`${s.projectCol} IN (:projectIds)`);
        if (opts.projectId) conds.push(`${s.projectCol} = :projectId`);
        try {
          const rows = await this.sequelize.query<Record<string, any>>(
            `SELECT ${s.select} FROM ${s.from} WHERE ${conds.join(' AND ')} ORDER BY updated_at DESC LIMIT ${limit}`,
            {
              type: QueryTypes.SELECT,
              replacements: {
                like,
                projectIds: projectIds ?? [],
                projectId: opts.projectId,
              },
            },
          );
          return rows.map((r): SearchHit => {
            const title = String(r.title ?? 'Untitled');
            const exact = title.toLowerCase().startsWith(term.toLowerCase());
            return {
              entity_type: s.entity,
              id: String(r.id),
              title,
              subtitle: r.subtitle ?? null,
              score: exact ? 2 : 1,
              meta: {
                status: r.status ?? null,
                project_id: r.project_id ?? null,
                updated_at: r.updated_at ?? null,
              },
            };
          });
        } catch {
          return [];
        }
      }),
    );

    return perSource
      .flat()
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}
