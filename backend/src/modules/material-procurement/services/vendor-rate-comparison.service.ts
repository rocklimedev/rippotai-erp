import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { VendorRateComparison } from '../models/vendor-rate-comparison.model';
import { Project } from '../../projects/models/projects.model';
import { Boq } from '../../boqs/models/boq.model';
import { SaveVendorRateComparisonDto } from '../dto/vendor-rate-comparison.dto';
import { isDeepStrictEqual } from 'node:util';

@Injectable()
export class VendorRateComparisonService {
  constructor(
    @InjectModel(VendorRateComparison)
    private readonly sheets: typeof VendorRateComparison,
    @InjectModel(Project) private readonly projects: typeof Project,
    @InjectModel(Boq) private readonly boqs: typeof Boq,
  ) {}

  list(projectId?: string) {
    return this.sheets.findAll({
      where: projectId ? { project_id: projectId } : {},
      attributes: { exclude: ['snapshot'] },
      include: [
        { model: Project, attributes: ['id', 'name'] },
        { model: Boq, attributes: ['id', 'title', 'boq_number'] },
      ],
      order: [['updatedAt', 'DESC']],
    });
  }

  async get(id: string) {
    const sheet = await this.sheets.findByPk(id, {
      include: [
        { model: Project, attributes: ['id', 'name'] },
        { model: Boq, attributes: ['id', 'title', 'boq_number'] },
      ],
    });
    if (!sheet) throw new NotFoundException('Rate comparison sheet not found');
    return sheet;
  }

  private validateSnapshot(dto: SaveVendorRateComparisonDto) {
    const s = dto.snapshot;
    if (!dto.title.trim())
      throw new BadRequestException('Sheet name is required');
    if (
      s.schema_version !== 1 ||
      s.boq?.id !== dto.boq_id ||
      s.boq?.project_id !== dto.project_id ||
      !Array.isArray(s.boq?.categories) ||
      !Array.isArray(s.vendors) ||
      !Array.isArray(s.selected_vendor_ids) ||
      s.selected_vendor_ids.length > 4 ||
      new Set(s.selected_vendor_ids).size !== s.selected_vendor_ids.length ||
      !s.vendor_rates ||
      typeof s.vendor_rates !== 'object' ||
      Array.isArray(s.vendor_rates) ||
      !s.vendor_names ||
      typeof s.vendor_names !== 'object' ||
      Array.isArray(s.vendor_names) ||
      !Array.isArray(s.rows) ||
      !s.summary ||
      typeof s.summary !== 'object'
    )
      throw new BadRequestException('Invalid comparison snapshot');
    if (
      s.vendors.some(
        (vendor) =>
          !vendor ||
          typeof vendor.id !== 'string' ||
          typeof vendor.name !== 'string',
      ) ||
      s.selected_vendor_ids.some(
        (id) => typeof id !== 'string' || !s.vendors.some((v) => v.id === id),
      )
    )
      throw new BadRequestException('Snapshot is missing selected vendors');
    if (
      s.boq.categories.some(
        (category) =>
          !category ||
          typeof category.id !== 'string' ||
          !Array.isArray(category.items) ||
          category.items.some(
            (item) =>
              !item ||
              typeof item.id !== 'string' ||
              ['quantity', 'rate', 'amount'].some(
                (key) =>
                  typeof item[key] !== 'number' ||
                  !Number.isFinite(item[key]) ||
                  item[key] < 0,
              ),
          ),
      )
    )
      throw new BadRequestException('Invalid BOQ snapshot lines');
    if (
      Object.values(s.vendor_rates).some(
        (rate) =>
          rate !== '' &&
          ((typeof rate !== 'string' && typeof rate !== 'number') ||
            !Number.isFinite(Number(rate)) ||
            Number(rate) < 0),
      )
    )
      throw new BadRequestException(
        'Vendor rates must be non-negative numbers',
      );
    if (Buffer.byteLength(JSON.stringify(s)) > 2 * 1024 * 1024)
      throw new BadRequestException('Comparison snapshot is too large');
  }

  async create(dto: SaveVendorRateComparisonDto, userId: string) {
    this.validateSnapshot(dto);
    const project = await this.projects.findByPk(dto.project_id);
    if (!project) throw new BadRequestException('Project not found');
    const boq = await this.boqs.findByPk(dto.boq_id);
    if (!boq || boq.project_id !== dto.project_id)
      throw new BadRequestException('Select a BOQ belonging to this project');
    return this.sheets.create({
      title: dto.title.trim(),
      project_id: dto.project_id,
      boq_id: dto.boq_id,
      notes: dto.notes || null,
      snapshot: dto.snapshot,
      revision: 1,
      created_by: userId,
    });
  }

  async update(id: string, dto: SaveVendorRateComparisonDto) {
    this.validateSnapshot(dto);
    const sheet = await this.get(id);
    if (dto.project_id !== sheet.project_id || dto.boq_id !== sheet.boq_id)
      throw new BadRequestException(
        'A saved sheet keeps its original project and BOQ. Create a new sheet for another BOQ.',
      );
    if (!isDeepStrictEqual(dto.snapshot.boq, sheet.snapshot.boq))
      throw new BadRequestException(
        'The saved BOQ snapshot cannot change. Create a new sheet for updated BOQ data.',
      );
    if (dto.revision !== sheet.revision)
      throw new ConflictException(
        'This sheet was updated elsewhere. Reload it before saving.',
      );
    const [count] = await this.sheets.update(
      {
        title: dto.title.trim(),
        notes: dto.notes || null,
        snapshot: dto.snapshot,
        revision: sheet.revision + 1,
      },
      { where: { id, revision: dto.revision } },
    );
    if (!count)
      throw new ConflictException(
        'This sheet was updated elsewhere. Reload it before saving.',
      );
    return this.get(id);
  }
}
