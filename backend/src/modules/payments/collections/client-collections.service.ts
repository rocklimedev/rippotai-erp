import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { QueryTypes } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { randomUUID } from 'crypto';
import { CreateClientCollectionDto } from './client-collection.dto';

export interface CollectionRow {
  id: string;
  project_id: string;
  type: 'TOKEN' | 'PROJECT_PAYMENT';
  amount: number;
  received_on: string;
  note: string | null;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
}

/** Amount collected from the client vs the project's total (payment schedule, else approved value). */
export function summarise(
  total: number,
  entries: Pick<CollectionRow, 'type' | 'amount'>[],
) {
  const token = entries
    .filter((e) => e.type === 'TOKEN')
    .reduce((s, e) => s + Number(e.amount), 0);
  const payments = entries
    .filter((e) => e.type === 'PROJECT_PAYMENT')
    .reduce((s, e) => s + Number(e.amount), 0);
  const collected = token + payments;
  return {
    total,
    token,
    payments,
    collected,
    balance: Math.max(0, total - collected),
    pct:
      total > 0
        ? Math.min(100, Math.round((collected / total) * 1000) / 10)
        : 0,
  };
}

@Injectable()
export class ClientCollectionsService {
  constructor(@InjectConnection() private readonly sequelize: Sequelize) {}

  private entries(projectId?: string) {
    return this.sequelize.query<CollectionRow>(
      `SELECT c.id, c.project_id, c.type, c.amount + 0 AS amount, DATE_FORMAT(c.received_on, '%Y-%m-%d') AS received_on,
              c.note, c.created_by, u.name AS created_by_name, c.created_at
         FROM client_collections c LEFT JOIN users u ON u.id = c.created_by
        WHERE c.deleted_at IS NULL ${projectId ? 'AND c.project_id = :projectId' : ''}
        ORDER BY c.received_on DESC, c.created_at DESC`,
      { replacements: { projectId }, type: QueryTypes.SELECT },
    );
  }

  /** Every live project: total amount, token + project payments collected, balance, entries. */
  async summary() {
    const projects = await this.sequelize.query<any>(
      `SELECT p.id, p.name, p.code, p.approved_value + 0 AS approved_value,
              (SELECT COALESCE(NULLIF(ps.total_payable, 0), ps.total_contract_value) + 0 FROM payment_schedules ps
                WHERE ps.project_id = p.id AND ps.deleted_at IS NULL
                ORDER BY (ps.status IN ('ACTIVE','COMPLETED')) DESC, ps.created_at DESC LIMIT 1) AS schedule_total
         FROM projects p
        WHERE p.deleted_at IS NULL AND p.archived_at IS NULL
        ORDER BY p.name`,
      { type: QueryTypes.SELECT },
    );
    const all = await this.entries();
    const byProject = new Map<string, CollectionRow[]>();
    all.forEach((e) =>
      byProject.set(e.project_id, [...(byProject.get(e.project_id) || []), e]),
    );
    const rows = projects.map((p) => {
      const entries = byProject.get(p.id) || [];
      const total =
        Number(p.schedule_total ?? 0) || Number(p.approved_value ?? 0);
      return {
        projectId: p.id,
        name: p.name,
        code: p.code,
        totalSource: Number(p.schedule_total ?? 0)
          ? 'payment-schedule'
          : 'approved-value',
        ...summarise(total, entries),
        entries,
      };
    });
    return {
      totals: summarise(
        rows.reduce((s, r) => s + r.total, 0),
        all,
      ),
      rows,
    };
  }

  async create(dto: CreateClientCollectionDto, userId?: string) {
    const [project] = await this.sequelize.query<any>(
      'SELECT id FROM projects WHERE id = :id AND deleted_at IS NULL',
      { replacements: { id: dto.project_id }, type: QueryTypes.SELECT },
    );
    if (!project) throw new NotFoundException('Project not found');
    if (!(Number(dto.amount) > 0))
      throw new BadRequestException('Amount must be more than zero');
    const id = randomUUID();
    await this.sequelize.query(
      `INSERT INTO client_collections (id, project_id, type, amount, received_on, note, created_by, created_at, updated_at)
       VALUES (:id, :projectId, :type, :amount, :receivedOn, :note, :userId, NOW(), NOW())`,
      {
        replacements: {
          id,
          projectId: dto.project_id,
          type: dto.type,
          amount: dto.amount,
          receivedOn: dto.received_on.slice(0, 10),
          note: dto.note?.trim() || null,
          userId: userId ?? null,
        },
      },
    );
    return (await this.entries(dto.project_id)).find((e) => e.id === id);
  }

  async remove(id: string) {
    const [found] = await this.sequelize.query<any>(
      'SELECT id FROM client_collections WHERE id = :id AND deleted_at IS NULL',
      { replacements: { id }, type: QueryTypes.SELECT },
    );
    if (!found) throw new NotFoundException('Entry not found');
    await this.sequelize.query(
      'UPDATE client_collections SET deleted_at = NOW() WHERE id = :id',
      {
        replacements: { id },
      },
    );
  }
}
