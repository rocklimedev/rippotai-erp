import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';

const tables: Record<string, string> = {
  projects: 'projects',
  boqs: 'boqs',
  quotations: 'quotations',
  'plan-of-actions': 'plan_of_actions',
  documents: 'documents',
  drawings: 'drawings',
  tasks: 'tasks',
  'project-briefs': 'project_briefs',
  'site-recces': 'site_recces',
  'budget-estimates': 'budget_estimates',
  'payment-schedules': 'payment_schedules',
  'purchase-orders': 'purchase_orders',
  'work-orders': 'work_orders',
  'delivery-challans': 'delivery_challans',
  'projects-phases': 'project_phases',
  'project-gates': 'project_gates',
  'project-planners': 'project_planners',
  'daily-site-reports': 'daily_site_reports',
  rfis: 'rfis',
  snags: 'snags',
  'scope-of-work': 'scope_of_work',
  'procurement/requirements': 'material_requirements',
  'procurement/sample-boards': 'sample_boards',
  'procurement/rate-sheets': 'material_rate_sheets',
  'procurement/quotations': 'material_quotations',
  'procurement/estimates': 'material_estimates',
  'site-ops/visits': 'visit_assignments',
  'site-ops/rfis': 'rfis',
  'site-ops/daily-reports': 'daily_site_reports',
  'site-ops/mockups': 'mockups',
  'site-ops/qc': 'qc_sign_offs',
  'site-ops/checklists': 'checklist_templates',
  'scope-of-work/categories': 'scope_categories',
  'scope-of-work/spaces': 'project_spaces',
  'scope-of-work/items': 'scope_items',
  'inventory/transactions': 'inventory_transactions',
};
const references: Record<string, string> = {
  projectId: 'projects',
  project_id: 'projects',
  boqId: 'boqs',
  boq_id: 'boqs',
  quotationId: 'quotations',
  quotation_id: 'quotations',
  plannerId: 'project_planners',
  planner_id: 'project_planners',
  gateId: 'project_gates',
  gate_id: 'project_gates',
  phaseId: 'project_phases',
  phase_id: 'project_phases',
  taskId: 'tasks',
  task_id: 'tasks',
  documentId: 'documents',
  document_id: 'documents',
  plan_of_action_id: 'plan_of_actions',
  purchase_order_id: 'purchase_orders',
  work_order_id: 'work_orders',
  memberId: 'team_members',
  teamMemberId: 'team_members',
  boq_ids: 'boqs',
  quotation_ids: 'quotations',
  materialRequirementId: 'material_requirements',
  material_requirement_id: 'material_requirements',
  estimateId: 'material_estimates',
  estimate_id: 'material_estimates',
  scopeId: 'scope_of_work',
  scope_id: 'scope_of_work',
  scheduleId: 'payment_schedules',
  schedule_id: 'payment_schedules',
};

@Injectable()
export class ProjectScopeService {
  constructor(private readonly sequelize: Sequelize) {}

  private model(table: string) {
    return Object.values(this.sequelize.models).find((model) => {
      const name = model.getTableName();
      return (typeof name === 'string' ? name : name.tableName) === table;
    });
  }

  private rootTable(resource: string) {
    return tables[resource] ?? resource.replace(/-/g, '_');
  }

  resourceFor(controller: string, handler: string, fallback: string) {
    const route = `${controller}/${handler}`
      .replace(/\/+/g, '/')
      .replace(/^\//, '');
    return (
      Object.keys(tables)
        .sort((a, b) => b.length - a.length)
        .find((key) => route === key || route.startsWith(`${key}/`)) ?? fallback
    );
  }

  isProjectResource(resource: string): boolean {
    return this.ownsProject(this.rootTable(resource));
  }

  private ownsProject(table: string, seen = new Set<string>()): boolean {
    if (table === 'projects') return true;
    if (seen.has(table)) return false;
    seen.add(table);
    const model = this.model(table);
    if (!model) return false;
    return Object.entries(model.rawAttributes).some(([field, attribute]) => {
      const parent =
        references[field] ??
        (typeof attribute.references === 'object'
          ? attribute.references.model
          : undefined);
      return (
        typeof parent === 'string' && this.ownsProject(parent, new Set(seen))
      );
    });
  }

  async fromRecord(
    table: string,
    id: string,
    visited = new Set<string>(),
  ): Promise<string[]> {
    const key = `${table}:${id}`;
    if (visited.has(key)) return [];
    visited.add(key);
    const model = this.model(table);
    if (!model)
      throw new ForbiddenException(`Unregistered ownership model: ${table}`);
    const row = await model.findByPk(id);
    if (!row) throw new NotFoundException('Referenced record not found');
    if (table === 'projects') return [String(row.get('id'))];
    const data = row.get({ plain: true }) as Record<string, any>;
    if (data.owner_type && data.owner_id) {
      const ownerTable = {
        PROJECT: 'projects',
        BOQ: 'boqs',
        QUOTATION: 'quotations',
        PLAN_OF_ACTION: 'plan_of_actions',
      }[data.owner_type];
      if (ownerTable)
        return this.fromRecord(ownerTable, data.owner_id, visited);
    }
    const ids: string[] = [];
    for (const [field, parent] of Object.entries(references)) {
      if (data[field])
        ids.push(...(await this.fromRecord(parent, data[field], visited)));
    }
    for (const [field, attribute] of Object.entries(model.rawAttributes)) {
      if (references[field] || !data[field]) continue;
      const parent =
        typeof attribute.references === 'object'
          ? attribute.references.model
          : undefined;
      if (typeof parent === 'string' && this.ownsProject(parent)) {
        ids.push(...(await this.fromRecord(parent, data[field], visited)));
      }
    }
    return [...new Set(ids)];
  }

  async resolve(resource: string, req: any, handler = ''): Promise<string[]> {
    const ids: string[] = [];
    const rootTable = this.rootTable(resource);
    if (this.model(rootTable) && req.params.id)
      ids.push(...(await this.fromRecord(rootTable, req.params.id)));
    if (resource === 'team' && handler.startsWith('members/') && req.params.id)
      ids.push(...(await this.fromRecord('team_members', req.params.id)));
    if (resource === 'team' && req.params.ownerId) {
      const ownerTable = {
        PROJECT: 'projects',
        BOQ: 'boqs',
        QUOTATION: 'quotations',
        PLAN_OF_ACTION: 'plan_of_actions',
      }[req.params.ownerType];
      if (ownerTable)
        ids.push(...(await this.fromRecord(ownerTable, req.params.ownerId)));
    }
    const visit = async (source: any) => {
      if (!source || typeof source !== 'object') return;
      if (Array.isArray(source)) {
        for (const item of source) await visit(item);
        return;
      }
      for (const [key, table] of Object.entries(references)) {
        const id = source?.[key];
        if (id !== undefined && id !== null && id !== '') {
          if (Array.isArray(id) && key.endsWith('_ids')) {
            for (const value of id) {
              if (typeof value !== 'string')
                throw new ForbiddenException('Invalid ownership reference');
              ids.push(...(await this.fromRecord(table, value)));
            }
            continue;
          }
          if (typeof id !== 'string')
            throw new ForbiddenException('Invalid ownership reference');
          ids.push(...(await this.fromRecord(table, id)));
        }
      }
      for (const [key, value] of Object.entries(source))
        if (!references[key] && value && typeof value === 'object')
          await visit(value);
    };
    for (const source of [req.params, req.body, req.query]) await visit(source);
    // Validate child identifiers independently; a permitted parent URL is not sufficient.
    for (const [key, suffix] of Object.entries({
      itemId: '_items',
      categoryId: '_categories',
      miscId: '_miscellaneous',
    })) {
      const childTable = rootTable.replace(/s$/, '') + suffix;
      if (req.params[key] && this.model(childTable))
        ids.push(...(await this.fromRecord(childTable, req.params[key])));
    }
    return [...new Set(ids)];
  }
}
