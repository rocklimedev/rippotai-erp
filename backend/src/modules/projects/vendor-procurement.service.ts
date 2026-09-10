import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ProcurementCategory } from './models/procurement-category.model';
import { ProjectVendorProcurement } from './models/project-vendor-procurement.model';
import { ProcurementCategoryType } from '@/common/enums/project-planner.enum';
import {
  CreateVendorProcurementDto,
  UpdateVendorProcurementDto,
} from './dto/vendor-procurement.dto';

@Injectable()
export class VendorProcurementService {
  constructor(
    @InjectModel(ProcurementCategory)
    private readonly categoryModel: typeof ProcurementCategory,
    @InjectModel(ProjectVendorProcurement)
    private readonly procurementModel: typeof ProjectVendorProcurement,
  ) {}

  listCategories(type?: ProcurementCategoryType) {
    return this.categoryModel.findAll({
      where: type ? { type } : {},
      order: [['sort_order', 'ASC']],
    });
  }

  /**
   * Full Vendor & Procurement sheet for a project: every category joined
   * with that project's row (if any exist yet, since rows are created
   * on demand rather than at project creation).
   */
  async getSheet(project_id: string) {
    const categories = await this.categoryModel.findAll({
      order: [['sort_order', 'ASC']],
    });
    const rows = await this.procurementModel.findAll({ where: { project_id } });
    const byCategory = new Map(rows.map((r) => [r.procurement_category_id, r]));
    return categories.map((c) => ({
      category: c,
      procurement: byCategory.get(c.id) ?? null,
    }));
  }

  async upsertRow(
    project_id: string,
    dto: CreateVendorProcurementDto,
    userId?: string,
  ) {
    const [row, created] = await this.procurementModel.findOrCreate({
      where: {
        project_id,
        procurement_category_id: dto.procurement_category_id,
      },
      defaults: {
        project_id,
        ...dto,
        created_by: userId ?? null,
        updated_by: userId ?? null,
      } as any,
    });
    if (!created) {
      await row.update({ ...dto, updated_by: userId ?? row.updated_by } as any);
    }
    return row;
  }

  async updateRow(
    id: string,
    dto: UpdateVendorProcurementDto,
    userId?: string,
  ) {
    const row = await this.procurementModel.findByPk(id);
    if (!row) throw new NotFoundException('Vendor procurement row not found');
    await row.update({ ...dto, updated_by: userId ?? row.updated_by } as any);
    return row;
  }
}
