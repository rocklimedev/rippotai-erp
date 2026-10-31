import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Model, ModelStatic, Op, Transaction } from 'sequelize';
import {
  SHARED_PROJECT_FIELDS,
  canReceiveSharedData,
  isMissingSharedValue,
  mergeRooms,
  missingSharedFields,
  normalizeSharedFacts,
  ProjectRoom,
  roomsFromBrief,
  roomsFromProjectSpaces,
  roomsFromRecce,
} from './shared-project-data';
import {
  PREFILL_MODEL_SEQUENCE,
  previousDocumentSteps,
} from './document-prefill';

@Injectable()
export class SharedProjectDataService implements OnModuleInit {
  private readonly logger = new Logger(SharedProjectDataService.name);
  constructor(@InjectConnection() private readonly sequelize: Sequelize) {}

  /** Client + project master facts, used only where documents left a gap. */
  private async masterFacts(projectId: string, transaction?: Transaction) {
    const facts: Record<string, unknown> = {};
    const projectModel = this.sequelize.models.Project;
    if (!projectModel) return facts;
    const project = await projectModel.findByPk(projectId, {
      transaction,
      include: projectModel.associations?.client ? ['client'] : [],
    });
    if (!project) return facts;
    const client = project.get('client') as Model | undefined;
    for (const [field, key] of Object.entries(SHARED_PROJECT_FIELDS.Project))
      facts[key] = project.get(field);
    Object.assign(facts, {
      projectName: project.get('name'),
      clientName: client?.get('name'),
      clientContactPerson: client?.get('contact_person'),
      clientPhone: client?.get('phone'),
      clientEmail: client?.get('email'),
      clientAddress: client?.get('address'),
    });
    return facts;
  }

  /** Canonical rooms list: project spaces first, then earlier documents' rooms. */
  async rooms(
    projectId: string,
    documents: Record<string, any> = {},
    transaction?: Transaction,
  ): Promise<ProjectRoom[]> {
    const spaceModel = this.sequelize.models.ProjectSpace;
    const spaces = spaceModel
      ? await spaceModel.findAll({ where: { projectId }, transaction })
      : [];
    return mergeRooms(
      roomsFromProjectSpaces(spaces.map((space) => space.get({ plain: true }))),
      roomsFromRecce(documents['site-recce']),
      roomsFromBrief(documents['client-brief']),
    );
  }

  /** Write rooms typed in any document into the canonical list; never overwrite a typed value. */
  async syncRooms(
    projectId: string,
    rooms: ProjectRoom[],
    transaction?: Transaction,
  ) {
    const spaceModel = this.sequelize.models.ProjectSpace;
    if (!spaceModel || !projectId) return;
    const existing = await spaceModel.findAll({
      where: { projectId },
      paranoid: false,
      transaction,
    });
    const key = (value: unknown) =>
      String(value ?? '')
        .trim()
        .toLowerCase();
    const byName = new Map(
      existing.map((space) => [key(space.get('name')), space]),
    );
    const slugs = new Set(existing.map((space) => String(space.get('slug'))));
    let order = Math.max(
      0,
      ...existing.map((space) => Number(space.get('sortOrder') ?? 0)),
    );
    for (const room of mergeRooms(rooms)) {
      const values: Record<string, unknown> = {
        description: room.notes,
        area: room.area,
        length: room.length,
        width: room.width,
        height: room.height,
        measurementUnit: room.unit,
      };
      const current = byName.get(key(room.name));
      if (current) {
        if (current.get('deletedAt')) continue; // removed on purpose
        const patch = Object.fromEntries(
          Object.entries(values).filter(
            ([field, value]) =>
              isMissingSharedValue(current.get(field)) &&
              !isMissingSharedValue(value),
          ),
        );
        if (Object.keys(patch).length)
          await current.update(patch, { transaction, hooks: false });
        continue;
      }
      const base =
        key(room.name)
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '') || 'space';
      let slug = base;
      for (let n = 2; slugs.has(slug); n++) slug = `${base}-${n}`;
      slugs.add(slug);
      const created = await spaceModel.create(
        {
          projectId,
          name: room.name.slice(0, 255),
          slug: slug.slice(0, 255),
          sortOrder: ++order,
          isActive: true,
          sourceDocument: room.source ?? null,
          ...Object.fromEntries(
            Object.entries(values).filter(
              ([, value]) => !isMissingSharedValue(value),
            ),
          ),
        } as any,
        { transaction, hooks: false },
      );
      byName.set(key(room.name), created);
    }
  }

  /** Room rows saved on a brief / recce flow into project spaces. */
  private registerRoomSync(
    childName: string,
    parentName: string,
    parentKey: string,
    toRoom: (row: any) => ProjectRoom,
  ) {
    const child = this.sequelize.models[childName];
    const parent = this.sequelize.models[parentName];
    if (!child || !parent) return;
    const sync = async (rows: Model[], options: any) => {
      try {
        const byParent = new Map<string, ProjectRoom[]>();
        for (const row of rows) {
          const id = row.get(parentKey) as string;
          if (!id) continue;
          byParent.set(id, [
            ...(byParent.get(id) || []),
            toRoom(row.get({ plain: true })),
          ]);
        }
        for (const [id, rooms] of byParent) {
          const owner = await parent.findByPk(id, {
            transaction: options?.transaction,
          });
          const projectId = (owner?.get('projectId') ??
            owner?.get('project_id')) as string;
          if (projectId)
            await this.syncRooms(projectId, rooms, options?.transaction);
        }
      } catch (error) {
        this.logger.warn(`Room sync skipped: ${(error as Error).message}`);
      }
    };
    child.addHook('afterCreate', 'syncProjectRooms', (row: Model, o: any) =>
      sync([row], o),
    );
    child.addHook('afterUpdate', 'syncProjectRooms', (row: Model, o: any) =>
      sync([row], o),
    );
    child.addHook(
      'afterBulkCreate',
      'syncProjectRooms',
      (rows: Model[], o: any) => sync(rows, o),
    );
  }

  private targets() {
    return Object.values(this.sequelize.models).filter(
      (model) => SHARED_PROJECT_FIELDS[model.name],
    );
  }

  private projectKey(model: ModelStatic<Model>) {
    return model.name === 'Project'
      ? 'id'
      : model.rawAttributes.projectId
        ? 'projectId'
        : 'project_id';
  }

  async prefill(
    projectId: string,
    sequence: string,
    transaction?: Transaction,
  ) {
    const steps = previousDocumentSteps(sequence);
    if (!steps) throw new BadRequestException('Unknown document sequence');
    const shared: Record<string, unknown> = {};
    const documents: Record<string, any> = {};
    const sources: Record<string, { sequence: string; id: unknown }> = {};
    for (const step of steps) {
      const model = this.sequelize.models[step.model];
      if (!model) continue;
      const where: Record<string, unknown> = {
        [this.projectKey(model)]: projectId,
      };
      if ('type' in step && step.type)
        where.type = { [Op.in]: [step.type, 'PROJECT'] };
      const includes = [
        'rooms',
        'spaceRequirements',
        'siteRestrictions',
        'phases',
        'milestones',
        'items',
        'categories',
        'procurement_items',
      ]
        .filter((name) => model.associations?.[name])
        .map((name) => {
          const child = model.associations[name].target;
          const nested = [
            'items',
            'projectSpace',
            'scopeCategory',
            'materialMaster',
            'phase',
          ].filter((key) => child.associations?.[key]);
          return {
            association: name,
            ...(nested.length ? { include: nested } : {}),
          };
        });
      const updated = model.rawAttributes.updatedAt
        ? 'updatedAt'
        : 'updated_at';
      const order: any[] = model.rawAttributes.version
        ? [
            ['version', 'DESC'],
            [updated, 'DESC'],
            ['id', 'DESC'],
          ]
        : [
            [updated, 'DESC'],
            ['id', 'DESC'],
          ];
      const rows = await model.findAll({
        where,
        order,
        transaction,
        include: includes,
      });
      const row = rows.find(
        (record) =>
          !['cancelled', 'archived', 'rejected', 'void'].includes(
            String(record.get('status') ?? '').toLowerCase(),
          ),
      );
      if (!row) continue;
      documents[step.id] = row.get({ plain: true });
      if (step.model === 'ProjectPlanner' && row.get('type') === 'PROJECT') {
        documents[step.id].items = (documents[step.id].items || []).filter(
          (item: any) =>
            item.phase?.module === ('type' in step ? step.type : undefined),
        );
      }
      for (const [field, key] of Object.entries(
        SHARED_PROJECT_FIELDS[model.name] ?? {},
      )) {
        const value = row.get(field);
        if (isMissingSharedValue(shared[key]) && !isMissingSharedValue(value)) {
          shared[key] = value;
          sources[key] = { sequence: step.id, id: row.get('id') };
        }
      }
    }
    // Master data is fallback only: it must not override the previous document.
    const master = await this.masterFacts(projectId, transaction);
    for (const [key, value] of Object.entries(master))
      if (isMissingSharedValue(shared[key]) && !isMissingSharedValue(value)) {
        shared[key] = value;
        sources[key] = {
          sequence: key.startsWith('client') ? 'client' : 'project',
          id: projectId,
        };
      }
    const hadSqft = !isMissingSharedValue(shared.siteAreaSqft);
    const hadArea = !isMissingSharedValue(shared.siteArea);
    normalizeSharedFacts(shared);
    if (!hadSqft && sources.siteArea) sources.siteAreaSqft = sources.siteArea;
    if (!hadArea && sources.siteAreaSqft)
      sources.siteArea = sources.siteAreaSqft;
    const rooms = await this.rooms(projectId, documents, transaction);
    shared.rooms = rooms;
    if (isMissingSharedValue(shared.roomCount) && rooms.length)
      shared.roomCount = rooms.length;
    return { projectId, sequence, shared, documents, sources };
  }

  async fetch(projectId: string, transaction?: Transaction, exclude?: Model) {
    const shared: Record<string, unknown> = {};
    // Master project data takes priority; documents supply details missing there.
    for (const model of this.targets().sort(
      (a, b) => Number(b.name === 'Project') - Number(a.name === 'Project'),
    )) {
      const rows = await model.findAll({
        where: { [this.projectKey(model)]: projectId },
        transaction,
        order: model.rawAttributes.version
          ? [['version', 'DESC']]
          : [
              [
                'createdAt' in model.rawAttributes ? 'createdAt' : 'created_at',
                'DESC',
              ],
            ],
      });
      for (const row of rows) {
        if (
          exclude &&
          !isMissingSharedValue(exclude.get('id')) &&
          row.constructor === exclude.constructor &&
          row.get('id') === exclude.get('id')
        )
          continue;
        for (const [field, key] of Object.entries(
          SHARED_PROJECT_FIELDS[model.name],
        )) {
          const value = row.get(field);
          if (isMissingSharedValue(shared[key]) && !isMissingSharedValue(value))
            shared[key] = value;
        }
      }
    }
    const master = await this.masterFacts(projectId, transaction);
    if (!isMissingSharedValue(master.projectName))
      shared.projectName = master.projectName;
    if (!isMissingSharedValue(master.clientName))
      shared.clientName = master.clientName;
    for (const [key, value] of Object.entries(master))
      if (isMissingSharedValue(shared[key]) && !isMissingSharedValue(value))
        shared[key] = value;
    normalizeSharedFacts(shared);
    return shared;
  }

  private patch(
    model: ModelStatic<Model>,
    values: Record<string, unknown>,
    shared: Record<string, unknown>,
  ) {
    const patch = missingSharedFields(
      values,
      SHARED_PROJECT_FIELDS[model.name],
      shared,
    );
    for (const [field, value] of Object.entries(patch)) {
      const type = model.rawAttributes[field]?.type as any;
      const maxLength = type?.options?.length;
      if (typeof value === 'string' && maxLength && value.length > maxLength)
        delete patch[field];
    }
    return patch;
  }

  onModuleInit() {
    this.registerRoomSync(
      'ProjectBriefSpaceRequirement',
      'ProjectBrief',
      'projectBriefId',
      (row) => roomsFromBrief({ spaceRequirements: [row] })[0],
    );
    this.registerRoomSync(
      'SiteRecceRoom',
      'SiteRecce',
      'site_recce_id',
      (row) => roomsFromRecce({ rooms: [row] })[0],
    );
    for (const model of this.targets()) {
      model.addHook(
        'beforeValidate',
        'reuseSharedProjectData',
        async (row: Model, options: any) => {
          if (!canReceiveSharedData(row.get({ plain: true }))) return;
          const projectId = row.get(this.projectKey(model)) as string;
          if (!projectId) return;
          const sequence = PREFILL_MODEL_SEQUENCE[model.name];
          const shared =
            row.isNewRecord && sequence
              ? (await this.prefill(projectId, sequence, options.transaction))
                  .shared
              : await this.fetch(projectId, options.transaction, row);
          const patch = this.patch(model, row.get({ plain: true }), shared);
          row.set(patch);
          if (options.fields)
            options.fields = [
              ...new Set([...options.fields, ...Object.keys(patch)]),
            ];
        },
      );
      model.addHook(
        'afterSave',
        'backfillSharedProjectData',
        async (row: Model, options: any) => {
          const projectId = row.get(this.projectKey(model)) as string;
          if (!projectId) return;
          const shared = await this.fetch(projectId, options.transaction);
          for (const [field, key] of Object.entries(
            SHARED_PROJECT_FIELDS[model.name],
          )) {
            const value = row.get(field);
            if (!isMissingSharedValue(value)) shared[key] = value;
          }
          normalizeSharedFacts(shared);
          for (const target of this.targets()) {
            const rows = await target.findAll({
              where: { [this.projectKey(target)]: projectId },
              transaction: options.transaction,
            });
            for (const document of rows) {
              if (
                target.name === model.name &&
                document.get('id') === row.get('id')
              )
                continue;
              if (
                target.name !== 'Project' &&
                !canReceiveSharedData(document.get({ plain: true }))
              )
                continue;
              const patch = this.patch(
                target,
                document.get({ plain: true }),
                shared,
              );
              if (Object.keys(patch).length) {
                // Compare the original values so a concurrent manual edit cannot be overwritten.
                const where: Record<string, unknown> = {
                  id: document.get('id'),
                };
                for (const field of Object.keys(patch))
                  where[field] = document.get(field) ?? null;
                for (const field of [
                  'status',
                  'locked',
                  'isLocked',
                  'approved_at',
                  'approvedAt',
                ]) {
                  if (target.rawAttributes[field])
                    where[field] = document.get(field) ?? null;
                }
                await target.update(patch, {
                  where,
                  transaction: options.transaction,
                  hooks: false,
                });
              }
            }
          }
        },
      );
    }
  }
}
