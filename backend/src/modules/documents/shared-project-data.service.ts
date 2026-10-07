import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Model, ModelStatic, Op, Transaction } from 'sequelize';
import { SHARED_PROJECT_FIELDS, canReceiveSharedData, isMissingSharedValue, missingSharedFields } from './shared-project-data';
import { PREFILL_MODEL_SEQUENCE, previousDocumentSteps } from './document-prefill';

@Injectable()
export class SharedProjectDataService implements OnModuleInit {
  constructor(@InjectConnection() private readonly sequelize: Sequelize) {}

  private targets() {
    return Object.values(this.sequelize.models).filter(model => SHARED_PROJECT_FIELDS[model.name]);
  }

  private projectKey(model: ModelStatic<Model>) {
    return model.name === 'Project' ? 'id' : model.rawAttributes.projectId ? 'projectId' : 'project_id';
  }

  async prefill(projectId: string, sequence: string, transaction?: Transaction) {
    const steps = previousDocumentSteps(sequence);
    if (!steps) throw new BadRequestException('Unknown document sequence');
    const shared: Record<string, unknown> = {};
    const documents: Record<string, any> = {};
    const sources: Record<string, { sequence: string; id: unknown }> = {};
    for (const step of steps) {
      const model = this.sequelize.models[step.model];
      if (!model) continue;
      const where: Record<string, unknown> = { [this.projectKey(model)]: projectId };
      if ('type' in step && step.type) where.type = { [Op.in]: [step.type, 'PROJECT'] };
      const includes = ['rooms', 'spaceRequirements', 'siteRestrictions', 'phases', 'milestones', 'items', 'categories', 'procurement_items']
        .filter(name => model.associations?.[name])
        .map(name => {
          const child = model.associations[name].target;
          const nested = ['items', 'projectSpace', 'scopeCategory', 'materialMaster', 'phase']
            .filter(key => child.associations?.[key]);
          return { association: name, ...(nested.length ? { include: nested } : {}) };
        });
      const updated = model.rawAttributes.updatedAt ? 'updatedAt' : 'updated_at';
      const order: any[] = model.rawAttributes.version ? [['version', 'DESC'], [updated, 'DESC'], ['id', 'DESC']] : [[updated, 'DESC'], ['id', 'DESC']];
      const rows = await model.findAll({ where, order, transaction, include: includes });
      const row = rows.find(record => !['cancelled', 'archived', 'rejected', 'void'].includes(String(record.get('status') ?? '').toLowerCase()));
      if (!row) continue;
      documents[step.id] = row.get({ plain: true });
      if (step.model === 'ProjectPlanner' && row.get('type') === 'PROJECT') {
        documents[step.id].items = (documents[step.id].items || []).filter((item: any) =>
          item.phase?.module === ('type' in step ? step.type : undefined));
      }
      for (const [field, key] of Object.entries(SHARED_PROJECT_FIELDS[model.name] ?? {})) {
        const value = row.get(field);
        if (isMissingSharedValue(shared[key]) && !isMissingSharedValue(value)) {
          shared[key] = value;
          sources[key] = { sequence: step.id, id: row.get('id') };
        }
      }
    }
    // Master data is fallback only: it must not override the previous document.
    const projectModel = this.sequelize.models.Project;
    if (projectModel) {
      const project = await projectModel.findByPk(projectId, { transaction, include: projectModel.associations.client ? ['client'] : [] });
      if (project) {
        const client = project.get('client') as Model | undefined;
        const fallback = { siteAddress: project.get('site_location'), projectTypeId: project.get('project_type_id'), projectName: project.get('name'), clientName: client?.get('name') };
        for (const [key, value] of Object.entries(fallback)) if (isMissingSharedValue(shared[key]) && !isMissingSharedValue(value)) shared[key] = value;
      }
    }
    return { projectId, sequence, shared, documents, sources };
  }

  async fetch(projectId: string, transaction?: Transaction, exclude?: Model) {
    const shared: Record<string, unknown> = {};
    // Master project data takes priority; documents supply details missing there.
    for (const model of this.targets().sort((a, b) => Number(b.name === 'Project') - Number(a.name === 'Project'))) {
      const rows = await model.findAll({
        where: { [this.projectKey(model)]: projectId }, transaction,
        order: model.rawAttributes.version ? [['version', 'DESC']] : [['createdAt' in model.rawAttributes ? 'createdAt' : 'created_at', 'DESC']],
      });
      for (const row of rows) {
        if (exclude && !isMissingSharedValue(exclude.get('id')) && row.constructor === exclude.constructor && row.get('id') === exclude.get('id')) continue;
        for (const [field, key] of Object.entries(SHARED_PROJECT_FIELDS[model.name])) {
          const value = row.get(field);
          if (isMissingSharedValue(shared[key]) && !isMissingSharedValue(value)) shared[key] = value;
        }
      }
    }
    const projectModel = this.sequelize.models.Project;
    if (projectModel) {
      const project = await projectModel.findByPk(projectId, { transaction, include: projectModel.associations.client ? ['client'] : [] });
      if (project) {
        shared.projectName = project.get('name');
        const client = project.get('client') as Model | undefined;
        const name = client?.get('name');
        if (!isMissingSharedValue(name)) shared.clientName = name;
      }
    }
    return shared;
  }

  private patch(model: ModelStatic<Model>, values: Record<string, unknown>, shared: Record<string, unknown>) {
    const patch = missingSharedFields(values, SHARED_PROJECT_FIELDS[model.name], shared);
    for (const [field, value] of Object.entries(patch)) {
      const type = model.rawAttributes[field]?.type as any;
      const maxLength = type?.options?.length;
      if (typeof value === 'string' && maxLength && value.length > maxLength) delete patch[field];
    }
    return patch;
  }

  onModuleInit() {
    for (const model of this.targets()) {
      model.addHook('beforeValidate', 'reuseSharedProjectData', async (row: Model, options: any) => {
        if (!canReceiveSharedData(row.get({ plain: true }))) return;
        const projectId = row.get(this.projectKey(model)) as string;
        if (!projectId) return;
        const sequence = PREFILL_MODEL_SEQUENCE[model.name];
        const shared = row.isNewRecord && sequence
          ? (await this.prefill(projectId, sequence, options.transaction)).shared
          : await this.fetch(projectId, options.transaction, row);
        const patch = this.patch(model, row.get({ plain: true }), shared);
        row.set(patch);
        if (options.fields) options.fields = [...new Set([...options.fields, ...Object.keys(patch)])];
      });
      model.addHook('afterSave', 'backfillSharedProjectData', async (row: Model, options: any) => {
        const projectId = row.get(this.projectKey(model)) as string;
        if (!projectId) return;
        const shared = await this.fetch(projectId, options.transaction);
        for (const [field, key] of Object.entries(SHARED_PROJECT_FIELDS[model.name])) {
          const value = row.get(field);
          if (!isMissingSharedValue(value)) shared[key] = value;
        }
        for (const target of this.targets()) {
          const rows = await target.findAll({ where: { [this.projectKey(target)]: projectId }, transaction: options.transaction });
          for (const document of rows) {
            if (target.name === model.name && document.get('id') === row.get('id')) continue;
            if (target.name !== 'Project' && !canReceiveSharedData(document.get({ plain: true }))) continue;
            const patch = this.patch(target, document.get({ plain: true }), shared);
            if (Object.keys(patch).length) {
              // Compare the original values so a concurrent manual edit cannot be overwritten.
              const where: Record<string, unknown> = { id: document.get('id') };
              for (const field of Object.keys(patch)) where[field] = document.get(field) ?? null;
              for (const field of ['status', 'locked', 'isLocked', 'approved_at', 'approvedAt']) {
                if (target.rawAttributes[field]) where[field] = document.get(field) ?? null;
              }
              await target.update(patch, { where, transaction: options.transaction, hooks: false });
            }
          }
        }
      });
    }
  }
}
