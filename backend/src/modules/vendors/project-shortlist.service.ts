import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ProjectShortlist } from './models/project-shortlist.model';
import { ShortlistEntry } from './models/shortlist-entry.model';
import { CreateProjectShortlistDto } from './dto/create-project-shortlist.dto';
import { UpdateProjectShortlistDto } from './dto/update-project-shortlist.dto';
import { QueryProjectShortlistDto } from './dto/query-shortlist.dto';
import {
  ShortlistType,
  Trade,
  WorkingType,
  ShortlistEntryStatus,
} from '@/common/enums/shortlist.enums';
import { Op } from 'sequelize';

@Injectable()
export class ProjectShortlistService {
  constructor(
    @InjectModel(ProjectShortlist)
    private readonly projectShortlistModel: typeof ProjectShortlist,
    @InjectModel(ShortlistEntry)
    private readonly shortlistEntryModel: typeof ShortlistEntry,
  ) {}

  /**
   * Create a new shortlist header for a project (VENDOR or MATERIAL).
   * Optionally seeds the standard 12 trades × 3 working types skeleton.
   */
  async create(
    dto: CreateProjectShortlistDto,
    userId?: string,
    seedSkeleton = true,
  ): Promise<ProjectShortlist> {
    // Prevent duplicate shortlist of same type for same project
    const existing = await this.projectShortlistModel.findOne({
      where: {
        project_id: dto.project_id,
        shortlist_type: dto.shortlist_type,
      },
    });
    if (existing) {
      throw new ConflictException(
        `A ${dto.shortlist_type} shortlist already exists for this project`,
      );
    }

    const shortlist = await this.projectShortlistModel.create({
      ...dto,
      created_by: userId ?? null,
      updated_by: userId ?? null,
    });

    if (seedSkeleton) {
      await this.seedStandardEntries(shortlist.id, userId);
    }

    return this.findOne(shortlist.id);
  }

  /**
   * Seed the classic Excel layout: 12 trades × 3 working types (empty vendor/material slots)
   */
  async seedStandardEntries(
    projectShortlistId: string,
    userId?: string,
  ): Promise<ShortlistEntry[]> {
    const trades = Object.values(Trade);
    const workingTypes = Object.values(WorkingType);
    const rows: Partial<ShortlistEntry>[] = [];

    let sort = 0;
    for (const trade of trades) {
      for (const wt of workingTypes) {
        rows.push({
          project_shortlist_id: projectShortlistId,
          trade,
          working_type: wt,
          sort_order: sort++,
          status: ShortlistEntryStatus.DRAFT,
          created_by: userId ?? null,
          updated_by: userId ?? null,
        });
      }
    }

    return this.shortlistEntryModel.bulkCreate(rows as any);
  }

  async findAll(query: QueryProjectShortlistDto): Promise<ProjectShortlist[]> {
    const where: any = {};
    if (query.project_id) where.project_id = query.project_id;
    if (query.shortlist_type) where.shortlist_type = query.shortlist_type;

    return this.projectShortlistModel.findAll({
      where,
      include: [
        {
          model: ShortlistEntry,
          as: 'entries',
          include: ['vendor', 'material'], // associations must be defined
        },
      ],
      order: [
        ['created_at', 'DESC'],
        [{ model: ShortlistEntry, as: 'entries' }, 'sort_order', 'ASC'],
      ],
    });
  }

  async findOne(id: string): Promise<ProjectShortlist> {
    const shortlist = await this.projectShortlistModel.findByPk(id, {
      include: [
        {
          model: ShortlistEntry,
          as: 'entries',
          include: ['vendor', 'material'],
        },
      ],
      order: [[{ model: ShortlistEntry, as: 'entries' }, 'sort_order', 'ASC']],
    });
    if (!shortlist) {
      throw new NotFoundException(`ProjectShortlist ${id} not found`);
    }
    return shortlist;
  }

  async findByProjectAndType(
    projectId: string,
    type: ShortlistType,
  ): Promise<ProjectShortlist> {
    const shortlist = await this.projectShortlistModel.findOne({
      where: { project_id: projectId, shortlist_type: type },
      include: [
        {
          model: ShortlistEntry,
          as: 'entries',
          include: ['vendor', 'material'],
        },
      ],
      order: [[{ model: ShortlistEntry, as: 'entries' }, 'sort_order', 'ASC']],
    });
    if (!shortlist) {
      throw new NotFoundException(
        `No ${type} shortlist found for project ${projectId}`,
      );
    }
    return shortlist;
  }

  async update(
    id: string,
    dto: UpdateProjectShortlistDto,
    userId?: string,
  ): Promise<ProjectShortlist> {
    const shortlist = await this.findOne(id);
    if (shortlist.is_locked && dto.is_locked !== false) {
      throw new BadRequestException('Shortlist is locked and cannot be edited');
    }
    await shortlist.update({
      ...dto,
      updated_by: userId ?? shortlist.updated_by,
    });
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const shortlist = await this.findOne(id);
    if (shortlist.is_locked) {
      throw new BadRequestException('Cannot delete a locked shortlist');
    }
    // Cascade delete entries (or rely on DB ON DELETE CASCADE)
    await this.shortlistEntryModel.destroy({
      where: { project_shortlist_id: id },
    });
    await shortlist.destroy();
  }

  /**
   * Returns a grid-friendly structure that mirrors the Excel layout
   * for easy frontend rendering and Excel export.
   */
  async getGridView(id: string) {
    const shortlist = await this.findOne(id);
    const trades = Object.values(Trade);
    const workingTypes = Object.values(WorkingType);

    const grid = trades.map((trade, idx) => {
      const tradeEntries = (shortlist.entries || []).filter(
        (e) => e.trade === trade,
      );
      return {
        s_no: idx + 1,
        trade,
        rows: workingTypes.map((wt) => {
          const entry = tradeEntries.find((e) => e.working_type === wt);
          return {
            working_type: wt,
            entry_id: entry?.id ?? null,
            name_of_vendor:
              entry?.name_of_vendor ??
              entry?.vendor?.name ??
              entry?.material?.name ??
              null,
            vendor_id: entry?.vendor_id ?? null,
            material_id: entry?.material_id ?? null,
            estimate_value: entry?.estimate_value ?? null,
            quotation_value: entry?.quotation_value ?? null,
            currency: entry?.currency ?? 'INR',
            status: entry?.status ?? ShortlistEntryStatus.DRAFT,
            is_selected: entry?.is_selected ?? false,
            notes: entry?.notes ?? null,
          };
        }),
      };
    });

    return {
      id: shortlist.id,
      project_id: shortlist.project_id,
      shortlist_type: shortlist.shortlist_type,
      title: shortlist.title,
      notes: shortlist.notes,
      is_locked: shortlist.is_locked,
      grid,
    };
  }
}
