import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { fn, col, Transaction } from 'sequelize';
import { Boq } from './models/boq.model';
import { BoqCategory } from './models/boq-category.model';
import { BoqItem } from './models/boq-item.model';
import { BoqTemplate } from './models/boq-template.model';
import { BoqTemplateCategory } from './models/boq-template-category.model';
import { BoqTemplateItem } from './models/boq-template-item.model';
import { BoqVersion } from './models/boq-version.model';
import { Project } from '../projects/models/projects.model';
import { CreateBoqDto } from './dto/create-boq.dto';
import { UpdateBoqDto } from './dto/update-boq.dto';
import {
  CreateBoqCategoryDto,
  UpdateBoqCategoryDto,
} from './dto/create-boq-category.dto';
import { CreateBoqItemDto, UpdateBoqItemDto } from './dto/create-boq-item.dto';
import { ReorderItemsDto } from './dto/reorder-items.dto';
import { BulkUpdateItemsDto } from './dto/bulk-update-items.dto';
import {
  ApproveBoqDto,
  DuplicateVersionDto,
  SubmitForApprovalDto,
} from './dto/boq-workflow.dto';
import { BoqActivityService } from './boq-activity.service';
import { BoqVersionService } from './boq-version.service';
import { BoqActivityAction, BoqStatus } from '@/common/enums/boq-enums';
import { User } from '../users/models/user.model';
const LOCKED_STATUSES = [
  BoqStatus.APPROVED,
  BoqStatus.FINAL,
  BoqStatus.AWAITING_APPROVAL,
];

// Project may carry denormalized billing fields at runtime that aren't
// (yet) part of the strict Project model typing. Narrowing through this
// interface instead of `any` keeps the property access type-safe.
interface ProjectBillingFields {
  client_name?: string | null;
  location?: string | null;
}

export interface BoqItemJSON {
  id: string;
  amount: number | string;
  [key: string]: unknown;
}

export interface BoqCategoryJSON {
  id: string;
  name: string;
  sort_order: number;
  items?: BoqItemJSON[];
  subtotal?: number;
  [key: string]: unknown;
}

export interface BoqJSON {
  id: string;
  design_amount: number | string;
  execution_amount: number | string;
  supervisor_amount: number | string;
  additional_total: number | string;
  misc_pct: number | string;
  categories?: BoqCategoryJSON[];
  items?: BoqItemJSON[];
  project_total?: number;
  misc_amount?: number;
  final_total?: number;
  [key: string]: unknown;
}
@Injectable()
export class BoqService {
  constructor(
    @InjectModel(Boq)
    private readonly boqModel: typeof Boq,
    @InjectModel(BoqCategory)
    private readonly categoryModel: typeof BoqCategory,
    @InjectModel(BoqItem)
    private readonly itemModel: typeof BoqItem,
    @InjectModel(BoqTemplate)
    private readonly templateModel: typeof BoqTemplate,
    @InjectModel(BoqTemplateCategory)
    private readonly templateCategoryModel: typeof BoqTemplateCategory,
    @InjectModel(Project)
    private readonly projectModel: typeof Project,
    private readonly sequelize: Sequelize,
    private readonly activity: BoqActivityService,
    private readonly boqVersionService: BoqVersionService,
  ) {}

  async findAll(project_id?: string) {
    return this.boqModel.findAll({
      where: project_id ? { project_id } : undefined,
      include: [{ model: Project, as: 'project', attributes: ['id', 'name'] }],
      order: [['updated_at', 'DESC']],
    });
  }

  async findOne(id: string) {
    const boq = await this.boqModel.findByPk(id, {
      include: [
        {
          model: Project,
          as: 'project',
          include: [
            {
              model: User,
              as: 'creator',
              attributes: ['id', 'name', 'email'],
            },
            {
              model: User,
              as: 'updater',
              attributes: ['id', 'name', 'email'],
            },
          ],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: User,
          as: 'updater',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: BoqVersion,
          as: 'currentVersion',
        },
        {
          model: BoqCategory,
          as: 'categories',
          include: [
            {
              model: BoqItem,
              as: 'items',
            },
          ],
        },
      ],
      order: [
        [{ model: BoqCategory, as: 'categories' }, 'sort_order', 'ASC'],
        [
          { model: BoqCategory, as: 'categories' },
          { model: BoqItem, as: 'items' },
          'sort_order',
          'ASC',
        ],
      ],
    });

    if (!boq) {
      throw new NotFoundException('BOQ not found');
    }

    return this.withComputedTotals(boq);
  }
  /**
   * Creates a new BOQ for a project. If template_id is supplied, the
   * template's categories/items are deep-copied as independent rows
   * (snapshot), so later edits to the template never affect this BOQ.
   *
   * This is also where a Boq family's versioning starts: the freshly
   * created row is v1, so it becomes its own "root" — a BoqVersion row
   * is created with boq_id pointing at this same boq, and the boq's
   * boq_version_id is set to that row. Every later clone
   * (see cloneAsNewVersion) chains off this root.
   */
  async create(dto: CreateBoqDto, actorId?: string) {
    const project = await this.projectModel.findByPk(dto.project_id);

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const projectBilling = project as unknown as ProjectBillingFields;

    const boqId = await this.sequelize.transaction(async (t: Transaction) => {
      const boq = await this.boqModel.create(
        {
          project_id: dto.project_id,
          title: dto.title || `${project.name} · Bill of Quantities`,
          status: BoqStatus.DRAFT,
          source_template_id: dto.source_template_id ?? null,
          client_name: projectBilling.client_name ?? null,
          location: projectBilling.location ?? null,
          created_by: actorId ?? null,
        } as Boq,
        {
          transaction: t,
        },
      );

      if (dto.source_template_id) {
        const template = await this.templateModel.findByPk(
          dto.source_template_id,
          {
            include: [
              {
                model: BoqTemplateCategory,
                as: 'categories',
                include: [
                  {
                    model: BoqTemplateItem,
                    as: 'items',
                  },
                ],
              },
            ],
            transaction: t,
          },
        );

        if (!template) {
          throw new BadRequestException('Template not found');
        }

        for (const templateCategory of template.categories) {
          const category = await this.categoryModel.create(
            {
              boq_id: boq.id,
              name: templateCategory.name,
              sort_order: templateCategory.sort_order,
            } as BoqCategory,
            {
              transaction: t,
            },
          );

          for (const templateItem of templateCategory.items) {
            await this.itemModel.create(
              {
                boq_category_id: category.id,

                library_item_id: null,

                name: templateItem.name,

                unit_id: null,
                unit: templateItem.unit,

                quantity: Number(templateItem.quantity ?? 0),
                rate: Number(templateItem.rate ?? 0),

                calc_type: 'M',

                location: null,
                detail: null,
                notes: null,

                hidden: false,
                sort_order: templateItem.sort_order ?? 0,
              } as any, // <-- temporary workaround
              {
                transaction: t,
              },
            );
          }
        }
      }

      await this.recomputeTotal(boq.id, t);

      // Seed this boq as the root of its own version lineage (v1).
      await this.boqVersionService.createVersionRecord(
        boq.id,
        {
          rootBoqId: boq.id,
          version: boq.version,
          versionName: (dto as Partial<{ version_name: string }>).version_name,
        },
        t,
      );

      await this.activity.log({
        boq_id: boq.id,
        user_id: actorId,
        action: BoqActivityAction.CREATED,
        target: `BOQ · ${boq.title}`,
        details: dto.source_template_id
          ? `Created from template ${dto.source_template_id}`
          : 'Created blank',
        transaction: t,
      });

      return boq.id;
    });

    return this.findOne(boqId);
  }
  async update(id: string, dto: UpdateBoqDto, actorId?: string) {
    const boq = await this.getOrThrow(id);
    this.assertEditable(boq);
    const statusChanged = dto.status && dto.status !== boq.status;

    await boq.update({ ...dto, updated_by: actorId ?? null });

    await this.activity.log({
      boq_id: boq.id,
      user_id: actorId,
      action: statusChanged
        ? this.actionForStatus(dto.status as BoqStatus)
        : BoqActivityAction.UPDATED,
      target: `BOQ · ${boq.title}`,
    });

    return this.findOne(id);
  }

  async remove(id: string, actorId?: string) {
    const boq = await this.getOrThrow(id);
    await boq.destroy();

    await this.activity.log({
      boq_id: id,
      user_id: actorId,
      action: BoqActivityAction.DELETED,
      target: `BOQ · ${boq.title}`,
    });

    return { id, deleted: true };
  }

  // ---------- Workflow: submit / approve / lock ----------

  async submitForApproval(
    id: string,
    dto: SubmitForApprovalDto,
    actorId?: string,
  ) {
    const boq = await this.getOrThrow(id);
    if (
      boq.status !== BoqStatus.DRAFT &&
      boq.status !== BoqStatus.IN_PROGRESS
    ) {
      throw new BadRequestException(
        'Only draft/in-progress BOQs can be submitted',
      );
    }
    await boq.update({
      status: BoqStatus.AWAITING_APPROVAL,
      updated_by: actorId ?? null,
    });

    await this.activity.log({
      boq_id: id,
      user_id: actorId,
      action: BoqActivityAction.SUBMITTED,
      target: `BOQ · ${boq.title}`,
      details: dto.note,
    });

    return this.findOne(id);
  }

  async approve(id: string, dto: ApproveBoqDto, actorId?: string) {
    const boq = await this.getOrThrow(id);
    if (boq.status !== BoqStatus.AWAITING_APPROVAL) {
      throw new BadRequestException(
        'Only BOQs awaiting approval can be approved',
      );
    }
    await boq.update({
      status: BoqStatus.APPROVED,
      locked: true,
      approved_at: new Date(),
      approved_by: actorId ?? null,
    });

    await this.activity.log({
      boq_id: id,
      user_id: actorId,
      action: BoqActivityAction.APPROVED,
      target: `BOQ · ${boq.title}`,
      details: dto.remarks,
    });

    // NOTE: "auto-attach a PDF to Documents" (per the approval dialog copy
    // in BoqWorkspace.jsx) belongs in a DocumentsService — call it here
    // once that module's API is available, e.g.:
    //   await this.documents.attachGenerated(boq.project_id, await this.renderPdf(id, 'internal'));

    return this.findOne(id);
  }

  /**
   * Deep-clones this BOQ (categories + items) into a fresh draft at
   * version + 1. Used by both "Create New Version" (from the locked-edit
   * modal) and "Duplicate Version" (explicit reason/note dialog).
   *
   * The clone is chained into the *same* version lineage as `source`:
   * we resolve the family's root boq id off `source` (falling back to
   * `source.id` itself if `source` has no boq_version_id yet — e.g. a
   * legacy row created before versioning existed) and create a new
   * BoqVersion row under that same root for the clone.
   */
  async cloneAsNewVersion(
    id: string,
    opts: { reason?: string; note?: string; versionName?: string },
    actorId?: string,
  ) {
    const source = await this.getOrThrow(id);

    const newId = await this.sequelize.transaction(async (t) => {
      const rootBoqId = await this.boqVersionService.resolveRootBoqId(
        source,
        t,
      );

      const clone = await this.boqModel.create(
        {
          project_id: source.project_id,
          title: source.title,
          source_template_id: source.source_template_id,
          status: BoqStatus.DRAFT,
          version: source.version + 1,
          client_name: source.client_name,
          location: source.location,
          prepared_by: source.prepared_by,
          date: source.date,
          terms_html: source.terms_html,
          misc_pct: source.misc_pct,
          design_amount: source.design_amount,
          execution_amount: source.execution_amount,
          supervisor_amount: source.supervisor_amount,
          additional_total: source.additional_total,
          created_by: actorId ?? null,
        } as Boq,
        { transaction: t },
      );

      const categories = await this.categoryModel.findAll({
        where: { boq_id: id },
        include: [BoqItem],
        order: [['sort_order', 'ASC']],
        transaction: t,
      });

      for (const cat of categories) {
        const newCat = await this.categoryModel.create(
          {
            boq_id: clone.id,
            name: cat.name,
            sort_order: cat.sort_order,
          } as BoqCategory,
          { transaction: t },
        );

        for (const item of cat.items ?? []) {
          await this.itemModel.create(
            {
              boq_category_id: newCat.id,
              library_item_id: item.library_item_id,
              name: item.name,
              unit_id: item.unit_id,
              unit: item.unit,
              quantity: item.quantity,
              rate: item.rate,
              amount: item.amount,
              calc_type: item.calc_type,
              location: item.location,
              detail: item.detail,
              notes: item.notes,
              hidden: item.hidden,
              sort_order: item.sort_order,
            } as BoqItem,
            { transaction: t },
          );
        }
      }

      await this.recomputeTotal(clone.id, t);

      await this.boqVersionService.createVersionRecord(
        clone.id,
        {
          rootBoqId,
          version: clone.version,
          versionName: opts.versionName ?? opts.reason,
        },
        t,
      );

      return clone.id;
    });

    await this.activity.log({
      boq_id: newId,
      user_id: actorId,
      action: BoqActivityAction.VERSION_CREATED,
      target: `BOQ · ${source.title}`,
      details: opts.reason
        ? `Duplicated from v${source.version} — ${opts.reason}${opts.note ? `: ${opts.note}` : ''}`
        : `Created as new draft version from locked v${source.version}`,
    });

    return this.findOne(newId);
  }

  async duplicateVersion(
    id: string,
    dto: DuplicateVersionDto,
    actorId?: string,
  ) {
    return this.cloneAsNewVersion(
      id,
      {
        reason: dto.reason,
        note: dto.note,
        versionName: (dto as Partial<{ version_name: string }>).version_name,
      },
      actorId,
    );
  }

  async newVersion(id: string, actorId?: string) {
    const boq = await this.getOrThrow(id);
    if (!boq.locked && !LOCKED_STATUSES.includes(boq.status)) {
      throw new BadRequestException(
        'Only a locked/approved BOQ needs a new version',
      );
    }
    return this.cloneAsNewVersion(id, {}, actorId);
  }

  /**
   * Full version history (BoqVersion rows + their Boq snapshots) for
   * the family that `id` belongs to, oldest first.
   */
  async getVersionHistory(id: string) {
    return this.boqVersionService.getHistory(id);
  }

  /**
   * Renames a single version's label (e.g. "Client revision 2")
   * without touching the underlying Boq snapshot.
   */
  async renameVersion(versionId: string, versionName: string) {
    return this.boqVersionService.renameVersion(versionId, versionName);
  }
  /**
   * Line-item diff between two Boq snapshots, for the "Compare current
   * with…" panel on BoqVersions.jsx. Items are matched across versions
   * by `library_item_id` when the row came from the catalog/library;
   * free-typed rows (no library_item_id) fall back to matching by
   * name, which is best-effort — renaming a free-typed item between
   * versions will show up as one removed + one added rather than one
   * updated.
   */
  async compareVersions(idA: string, idB: string) {
    const [a, b] = await Promise.all([this.findOne(idA), this.findOne(idB)]);

    type FlatItem = { key: string; description: string; amount: number };

    const flatten = (boq: BoqJSON): FlatItem[] =>
      (boq.items ?? []).map((i) => ({
        key: String(i.library_item_id ?? i.name),
        description: String(i.name ?? ''),
        amount: Number(i.amount || 0),
      }));

    const itemsA = flatten(a);
    const itemsB = flatten(b);
    const mapA = new Map(itemsA.map((i) => [i.key, i]));
    const mapB = new Map(itemsB.map((i) => [i.key, i]));

    const added = itemsB.filter((i) => !mapA.has(i.key));
    const removed = itemsA.filter((i) => !mapB.has(i.key));
    const updated = itemsB
      .filter((i) => {
        const before = mapA.get(i.key);
        return before !== undefined && before.amount !== i.amount;
      })
      .map((after) => ({ before: mapA.get(after.key)!, after }));

    const finalTotalA = Number(a.final_total || 0);
    const finalTotalB = Number(b.final_total || 0);

    return {
      a: { id: a.id, version: a.version, final_total: finalTotalA },
      b: { id: b.id, version: b.version, final_total: finalTotalB },
      delta: Math.round((finalTotalB - finalTotalA) * 100) / 100,
      added,
      removed,
      updated,
    };
  }

  // ---------- Categories ----------

  async addCategory(
    boqId: string,
    dto: CreateBoqCategoryDto & {
      catalog_code?: string;
      include_items?: boolean;
    },
    actorId?: string,
  ) {
    const boq = await this.getOrThrow(boqId);
    this.assertEditable(boq);

    let name = dto.name;
    let sourceItems: BoqTemplateItem[] = [];

    if (dto.catalog_code) {
      const templateCat = await this.templateCategoryModel.findOne({
        where: { id: dto.catalog_code },
        include: [BoqTemplateItem],
      });
      if (!templateCat) {
        throw new NotFoundException('Catalog category not found');
      }
      name = name || templateCat.name;
      if (dto.include_items !== false) sourceItems = templateCat.items ?? [];
    }

    if (!name) throw new BadRequestException('Category name is required');

    const category = await this.sequelize.transaction(async (t) => {
      const cat = await this.categoryModel.create(
        {
          boq_id: boqId,
          name,
          sort_order: dto.sort_order ?? 0,
        } as BoqCategory,
        { transaction: t },
      );

      for (const [idx, item] of sourceItems.entries()) {
        await this.itemModel.create(
          {
            boq_category_id: cat.id,
            library_item_id: item.library_item_id,
            name: item.name,
            unit_id: item.unit_id,
            unit: item.unit,
            quantity: item.quantity,
            rate: item.rate,
            amount: Number(item.quantity) * Number(item.rate),
            notes: item.notes,
            sort_order: idx,
          } as BoqItem,
          { transaction: t },
        );
      }

      if (sourceItems.length) await this.recomputeTotal(boqId, t);
      return cat;
    });

    await this.activity.log({
      boq_id: boqId,
      user_id: actorId,
      action: BoqActivityAction.CATEGORY_ADDED,
      target: `Category · ${category.name}`,
      details: sourceItems.length
        ? `Added with ${sourceItems.length} preset items from catalog`
        : undefined,
    });

    return this.findOne(boqId);
  }

  async updateCategory(
    boqId: string,
    categoryId: string,
    dto: UpdateBoqCategoryDto,
  ) {
    const boq = await this.getOrThrow(boqId);
    this.assertEditable(boq);
    const category = await this.getCategoryOrThrow(boqId, categoryId);
    await category.update(dto);
    return this.findOne(boqId);
  }

  async removeCategory(boqId: string, categoryId: string, actorId?: string) {
    const boq = await this.getOrThrow(boqId);
    this.assertEditable(boq);
    const category = await this.getCategoryOrThrow(boqId, categoryId);
    await category.destroy();
    await this.recomputeTotal(boqId);

    await this.activity.log({
      boq_id: boqId,
      user_id: actorId,
      action: BoqActivityAction.CATEGORY_DELETED,
      target: `Category · ${category.name}`,
    });

    return this.findOne(boqId);
  }

  // ---------- Line items ----------

  async addItem(boqId: string, dto: CreateBoqItemDto, actorId?: string) {
    const boq = await this.getOrThrow(boqId);
    this.assertEditable(boq);
    const category = await this.getCategoryOrThrow(boqId, dto.boq_category_id);
    const quantity = dto.quantity ?? 0;
    const rate = dto.rate ?? 0;
    const calcType = dto.calc_type ?? 'M';

    const item = await this.itemModel.create({
      boq_category_id: category.id,
      library_item_id: dto.library_item_id ?? null,
      name: dto.name ?? '',
      unit_id: dto.unit_id ?? null,
      unit: dto.unit ?? null,
      quantity,
      rate,
      amount: calcType === 'L' ? (dto.amount ?? 0) : quantity * rate,
      calc_type: calcType,
      location: dto.location ?? null,
      detail: dto.detail ?? null,
      notes: dto.notes ?? null,
      sort_order: dto.sort_order ?? 0,
    } as BoqItem);

    await this.recomputeTotal(boqId);

    await this.activity.log({
      boq_id: boqId,
      user_id: actorId,
      action: BoqActivityAction.ITEM_ADDED,
      target: `Item · ${item.name}`,
    });

    return this.findOne(boqId);
  }

  async updateItem(
    boqId: string,
    itemId: string,
    dto: UpdateBoqItemDto & { hidden?: boolean },
    actorId?: string,
  ) {
    const boq = await this.getOrThrow(boqId);
    const item = await this.getItemOrThrow(boqId, itemId);

    // Visibility toggling is explicitly allowed even on a locked BOQ —
    // it doesn't change priced content, only what's included in the
    // client PDF export.
    const onlyTogglingVisibility =
      Object.keys(dto).every((k) => k === 'hidden') && dto.hidden !== undefined;
    if (!onlyTogglingVisibility) this.assertEditable(boq);

    if (dto.boq_category_id && dto.boq_category_id !== item.boq_category_id) {
      await this.getCategoryOrThrow(boqId, dto.boq_category_id);
    }

    const quantity = dto.quantity ?? Number(item.quantity);
    const rate = dto.rate ?? Number(item.rate);
    const calcType = dto.calc_type ?? item.calc_type;
    const rateChanged =
      dto.rate !== undefined && Number(dto.rate) !== Number(item.rate);
    const moved =
      dto.boq_category_id !== undefined &&
      dto.boq_category_id !== item.boq_category_id;

    await item.update({
      ...dto,
      quantity,
      rate,
      calc_type: calcType,
      amount: calcType === 'L' ? (dto.amount ?? item.amount) : quantity * rate,
    });

    await this.recomputeTotal(boqId);

    if (onlyTogglingVisibility) {
      await this.activity.log({
        boq_id: boqId,
        user_id: actorId,
        action: dto.hidden
          ? BoqActivityAction.ITEM_HIDDEN
          : BoqActivityAction.ITEM_SHOWN,
        target: `Item · ${item.name}`,
      });
    } else if (moved) {
      await this.activity.log({
        boq_id: boqId,
        user_id: actorId,
        action: BoqActivityAction.ITEM_MOVED,
        target: `Item · ${item.name}`,
      });
    } else {
      await this.activity.log({
        boq_id: boqId,
        user_id: actorId,
        action: rateChanged
          ? BoqActivityAction.RATE_CHANGED
          : BoqActivityAction.ITEM_UPDATED,
        target: `Item · ${item.name}`,
        details: rateChanged ? `Rate updated to ${rate}` : undefined,
      });
    }

    return this.findOne(boqId);
  }

  async removeItem(boqId: string, itemId: string, actorId?: string) {
    const boq = await this.getOrThrow(boqId);
    this.assertEditable(boq);
    const item = await this.getItemOrThrow(boqId, itemId);
    await item.destroy();
    await this.recomputeTotal(boqId);

    await this.activity.log({
      boq_id: boqId,
      user_id: actorId,
      action: BoqActivityAction.ITEM_DELETED,
      target: `Item · ${item.name}`,
    });

    return this.findOne(boqId);
  }

  async reorderItems(boqId: string, dto: ReorderItemsDto, actorId?: string) {
    const boq = await this.getOrThrow(boqId);
    this.assertEditable(boq);
    await this.getCategoryOrThrow(boqId, dto.category_id);

    await this.sequelize.transaction(async (t) => {
      await Promise.all(
        dto.ordered_ids.map((itemId, idx) =>
          this.itemModel.update(
            { sort_order: idx },
            {
              where: { id: itemId, boq_category_id: dto.category_id },
              transaction: t,
            },
          ),
        ),
      );
    });

    await this.activity.log({
      boq_id: boqId,
      user_id: actorId,
      action: BoqActivityAction.ITEM_REORDERED,
      target: `Category items reordered`,
    });

    return this.findOne(boqId);
  }

  async bulkUpdateItems(
    boqId: string,
    dto: BulkUpdateItemsDto,
    actorId?: string,
  ) {
    const boq = await this.getOrThrow(boqId);
    this.assertEditable(boq);
    if (!dto.ids?.length) throw new BadRequestException('No items selected');

    const items = await this.itemModel.findAll({
      where: { id: dto.ids },
      include: [{ model: BoqCategory, where: { boq_id: boqId } }],
    });
    if (!items.length) throw new NotFoundException('No matching items found');

    const itemIds = items.map((i) => i.id);

    switch (dto.op) {
      case 'delete':
        await this.itemModel.destroy({ where: { id: itemIds } });
        break;
      case 'change_unit':
        if (!dto.value) throw new BadRequestException('unit value required');
        await this.itemModel.update(
          { unit: dto.value },
          { where: { id: itemIds } },
        );
        break;
      case 'hide':
        await this.itemModel.update(
          { hidden: true },
          { where: { id: itemIds } },
        );
        break;
      case 'show':
        await this.itemModel.update(
          { hidden: false },
          { where: { id: itemIds } },
        );
        break;
      default: {
        // Exhaustiveness check: if BulkItemOp ever gains a new member
        // without a matching case above, this line fails to compile
        // instead of silently falling through at runtime.
        const _exhaustive: never = dto.op;
        throw new BadRequestException(
          `Unsupported bulk op: ${String(_exhaustive)}`,
        );
      }
    }

    await this.recomputeTotal(boqId);

    await this.activity.log({
      boq_id: boqId,
      user_id: actorId,
      action: BoqActivityAction.ITEMS_BULK_UPDATED,
      target: `${items.length} item(s)`,
      details: `op=${dto.op}${dto.value ? ` value=${dto.value}` : ''}`,
    });

    return this.findOne(boqId);
  }
  // ---------- Catalog (for "Add Category" picker) ----------

  async getCatalog() {
    const categories = await this.templateCategoryModel.findAll({
      include: [BoqTemplateItem],
      order: [['sort_order', 'ASC']],
    });
    return categories.map((c) => ({
      code: c.id,
      name: c.name,
      items: (c.items ?? []).map((i) => ({
        name: i.name,
        unit: i.unit,
        rate: i.rate,
      })),
    }));
  }

  // ---------- helpers ----------

  private assertEditable(boq: Boq) {
    if (boq.locked || LOCKED_STATUSES.includes(boq.status)) {
      throw new BadRequestException(
        'This BOQ is locked. Create a new version to edit it.',
      );
    }
  }

  private async getOrThrow(id: string) {
    const boq = await this.boqModel.findByPk(id);
    if (!boq) throw new NotFoundException('BOQ not found');
    return boq;
  }

  private async getCategoryOrThrow(boqId: string, categoryId: string) {
    const category = await this.categoryModel.findOne({
      where: { id: categoryId, boq_id: boqId },
    });
    if (!category) throw new NotFoundException('BOQ category not found');
    return category;
  }

  private async getItemOrThrow(boqId: string, itemId: string) {
    const item = await this.itemModel.findByPk(itemId, {
      include: [{ model: BoqCategory, where: { boq_id: boqId } }],
    });
    if (!item) throw new NotFoundException('BOQ item not found');
    return item;
  }

  private actionForStatus(status: BoqStatus): BoqActivityAction {
    switch (status) {
      case BoqStatus.AWAITING_APPROVAL:
        return BoqActivityAction.SUBMITTED;
      case BoqStatus.APPROVED:
        return BoqActivityAction.APPROVED;
      case BoqStatus.RETURNED:
        return BoqActivityAction.REJECTED;
      case BoqStatus.ARCHIVED:
        return BoqActivityAction.ARCHIVED;
      default:
        return BoqActivityAction.UPDATED;
    }
  }

  private async recomputeTotal(boqId: string, transaction?: Transaction) {
    const result = (await this.itemModel.findOne({
      attributes: [[fn('COALESCE', fn('SUM', col('amount')), 0), 'total']],
      include: [
        {
          model: BoqCategory,
          attributes: [],
          where: { boq_id: boqId },
        },
      ],
      raw: true,
      transaction,
    })) as unknown as { total: string } | null;

    await this.boqModel.update(
      {
        total_value: Number(result?.total ?? 0),
      },
      {
        where: { id: boqId },
        transaction,
      },
    );
  }

  /**
   * Attaches category subtotals, item S.No-friendly shape isn't needed
   * server-side, but the summary panel and pre-export checklist both
   * need project_total / misc_amount / final_total computed from live
   * line items rather than trusted client input.
   */
  private withComputedTotals(boq: Boq): BoqJSON {
    const plain = boq.toJSON() as unknown as BoqJSON;

    plain.categories = (plain.categories ?? []).map((cat) => ({
      ...cat,
      subtotal: (cat.items ?? []).reduce(
        (sum, i) => sum + Number(i.amount || 0),
        0,
      ),
    }));
    plain.items = plain.categories.flatMap((c) => c.items ?? []);

    const lineItemsTotal = plain.items.reduce(
      (sum, i) => sum + Number(i.amount || 0),
      0,
    );
    const projectTotal =
      lineItemsTotal +
      Number(plain.design_amount || 0) +
      Number(plain.execution_amount || 0) +
      Number(plain.supervisor_amount || 0) +
      Number(plain.additional_total || 0);
    const miscAmount =
      Math.round(projectTotal * (Number(plain.misc_pct || 0) / 100) * 100) /
      100;

    plain.project_total = Math.round(projectTotal * 100) / 100;
    plain.misc_amount = miscAmount;
    plain.final_total = Math.round((projectTotal + miscAmount) * 100) / 100;

    return plain;
  }
}
