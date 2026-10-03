import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Transaction } from 'sequelize';
import {
  ShortlistEntryStatus,
  ShortlistType,
} from '@/common/enums/shortlist.enums';
import { ProjectScopeCategory } from '../scope-of-work/models/project-scope-category.model';
import { ScopeCategory } from '../scope-of-work/models/scope-category.model';
import { MaterialRequirement } from '../material-procurement/models/material-requirement.model';
import { MaterialMaster } from '../material-procurement/models/material-master.model';
import { ProjectBrief } from '../brief/models/project-brief.model';
import { ProjectBriefProcurementCategory } from '../brief/models/project-brief-procurement-category.model';
import { Vendor } from './models/vendors.model';
import { ShortlistPackage } from './models/shortlist-package.model';
import { ProjectShortlist } from './models/project-shortlist.model';
import { ShortlistEntry } from './models/shortlist-entry.model';
import { CreateShortlistPackageDto } from './dto/shortlist-package.dto';
import { matchesProjectTrade } from './shortlist-package-matching';

@Injectable()
export class ShortlistPackageService {
  constructor(
    @InjectModel(ShortlistPackage)
    private readonly packages: typeof ShortlistPackage,
    private readonly sequelize: Sequelize,
  ) {}

  list() {
    return this.packages.findAll({ order: [['created_at', 'DESC']] });
  }

  async findOne(id: string) {
    const pkg = await this.packages.findByPk(id);
    if (!pkg) throw new NotFoundException('Shortlist package not found');
    return pkg;
  }

  async create(dto: CreateShortlistPackageDto) {
    const source = await ProjectShortlist.findByPk(dto.source_shortlist_id, {
      include: [ShortlistEntry],
    });
    if (!source) throw new NotFoundException('Source shortlist not found');
    const entries = (source.entries ?? [])
      .filter(
        (row) =>
          row.status !== ShortlistEntryStatus.REJECTED &&
          (row.vendor_id || row.material_id),
      )
      .map((row) => ({
        trade: row.trade,
        working_type: row.working_type,
        vendor_id: row.vendor_id,
        material_id: row.material_id,
        name_of_vendor: row.name_of_vendor,
        notes: row.notes,
      }));
    if (!entries.length)
      throw new BadRequestException(
        'Assign vendors or materials before saving a package',
      );
    // Commercial values, quotations and selection decisions belong to the source project.
    return this.packages.create({
      name: dto.name,
      shortlist_type: source.shortlist_type,
      entries,
    });
  }

  async remove(id: string) {
    await (await this.findOne(id)).destroy();
  }

  private async plan(id: string, targetId: string, transaction?: Transaction) {
    const pkg = await this.findOne(id);
    const target = await ProjectShortlist.findByPk(targetId, {
      transaction,
      ...(transaction ? { lock: transaction.LOCK.UPDATE } : {}),
    });
    if (!target) throw new NotFoundException('Target shortlist not found');
    if (target.is_locked) throw new BadRequestException('Shortlist is locked');
    if (target.shortlist_type !== pkg.shortlist_type)
      throw new BadRequestException('Package and shortlist types must match');
    const [categories, requirements, briefCategories, existing] =
      await Promise.all([
        ProjectScopeCategory.findAll({
          where: { projectId: target.project_id, isActive: true },
          include: [{ model: ScopeCategory, where: { isActive: true } }],
          transaction,
        }),
        MaterialRequirement.findAll({
          where: { projectId: target.project_id },
          transaction,
        }),
        ProjectBriefProcurementCategory.findAll({
          include: [
            { model: ProjectBrief, where: { projectId: target.project_id } },
          ],
          transaction,
        }),
        ShortlistEntry.findAll({
          where: { project_shortlist_id: target.id },
          transaction,
        }),
      ]);
    const names = [
      ...categories.map((row) => row.scopeCategory.name),
      ...categories.map((row) => row.scopeCategory.slug),
      ...briefCategories.map((row) => row.category),
    ];
    const materialIds = new Set(
      requirements.map((row) => row.materialId).filter(Boolean),
    );
    const ready: {
      entry: ShortlistPackage['entries'][number];
      existing?: ShortlistEntry;
    }[] = [];
    const skipped: { trade: string; working_type: string; reason: string }[] =
      [];
    for (const entry of pkg.entries) {
      const row = existing.find(
        (row) =>
          row.trade === entry.trade && row.working_type === entry.working_type,
      );
      let reason: string | undefined;
      if (
        pkg.shortlist_type === ShortlistType.VENDOR &&
        !matchesProjectTrade(entry.trade, names)
      )
        reason = 'Service is not marked in this project';
      else if (
        pkg.shortlist_type === ShortlistType.MATERIAL &&
        (!entry.material_id || !materialIds.has(entry.material_id))
      )
        reason = 'Material is not required in this project';
      else if (
        row &&
        (row.vendor_id ||
          row.material_id ||
          row.name_of_vendor ||
          row.is_selected ||
          row.quotation_id ||
          row.estimate_value != null ||
          row.quotation_value != null ||
          row.status !== ShortlistEntryStatus.DRAFT)
      )
        reason = 'Target row already contains project data';
      else if (
        entry.vendor_id &&
        !(await Vendor.findByPk(entry.vendor_id, { transaction }))
      )
        reason = 'Vendor no longer exists';
      else if (
        entry.material_id &&
        !(await MaterialMaster.findByPk(entry.material_id, { transaction }))
      )
        reason = 'Material no longer exists';
      if (reason)
        skipped.push({
          trade: entry.trade,
          working_type: entry.working_type,
          reason,
        });
      else ready.push({ entry, existing: row });
    }
    return { target, ready, skipped };
  }

  async preview(id: string, targetId: string) {
    const { ready, skipped } = await this.plan(id, targetId);
    return { applicable: ready.map((row) => row.entry), skipped };
  }

  async apply(id: string, targetId: string) {
    return this.sequelize.transaction(async (transaction) => {
      const { target, ready, skipped } = await this.plan(
        id,
        targetId,
        transaction,
      );
      for (const { entry, existing } of ready) {
        const values = {
          ...entry,
          status: ShortlistEntryStatus.SHORTLISTED,
          is_selected: false,
        };
        if (existing) await existing.update(values, { transaction });
        else
          await ShortlistEntry.create(
            { ...values, project_shortlist_id: target.id },
            { transaction },
          );
      }
      return { applied: ready.length, skipped, target_shortlist_id: target.id };
    });
  }
}
