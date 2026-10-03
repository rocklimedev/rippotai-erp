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

@Injectable()
export class ProjectShortlistService {
  constructor(
    @InjectModel(ProjectShortlist)
    private readonly projectShortlistModel: typeof ProjectShortlist,

    @InjectModel(ShortlistEntry)
    private readonly shortlistEntryModel: typeof ShortlistEntry,
  ) {}

  // ============================================================
  // CREATE
  // ============================================================

  async create(
    dto: CreateProjectShortlistDto,
    userId?: string,
    seedSkeleton = true,
  ): Promise<ProjectShortlist> {
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

    let shortlist: ProjectShortlist;

    try {
      shortlist = await this.projectShortlistModel.create({
        ...dto,
        created_by: userId ?? null,
        updated_by: userId ?? null,
      });
    } catch (error: any) {
      // Handles race condition against DB unique constraint.
      if (
        error?.name === 'SequelizeUniqueConstraintError' ||
        error?.parent?.code === 'ER_DUP_ENTRY'
      ) {
        throw new ConflictException(
          `A ${dto.shortlist_type} shortlist already exists for this project`,
        );
      }

      throw error;
    }

    if (seedSkeleton) {
      await this.seedStandardEntries(shortlist.id, userId);
    }

    return this.findOne(shortlist.id);
  }

  // ============================================================
  // SEED 36 ROW SKELETON
  // ============================================================

  async seedStandardEntries(
    projectShortlistId: string,
    userId?: string,
  ): Promise<ShortlistEntry[]> {
    const shortlist =
      await this.projectShortlistModel.findByPk(projectShortlistId);

    if (!shortlist) {
      throw new NotFoundException(
        `ProjectShortlist ${projectShortlistId} not found`,
      );
    }

    const trades = Object.values(Trade);
    const workingTypes = Object.values(WorkingType);

    const existingEntries = await this.shortlistEntryModel.findAll({
      where: {
        project_shortlist_id: projectShortlistId,
      },
      attributes: ['id', 'trade', 'working_type'],
    });

    const existingKeys = new Set(
      existingEntries.map((entry) => `${entry.trade}::${entry.working_type}`),
    );

    const rows: Partial<ShortlistEntry>[] = [];

    let sortOrder = existingEntries.length;

    for (const trade of trades) {
      for (const workingType of workingTypes) {
        const key = `${trade}::${workingType}`;

        if (existingKeys.has(key)) {
          continue;
        }

        rows.push({
          project_shortlist_id: projectShortlistId,
          trade,
          working_type: workingType,
          sort_order: sortOrder++,
          status: ShortlistEntryStatus.DRAFT,
          is_selected: false,
          currency: 'INR',
          vendor_id: null,
          material_id: null,
          name_of_vendor: null,
          estimate_value: null,
          quotation_value: null,
          quotation_id: null,
          notes: null,
          created_by: userId ?? null,
          updated_by: userId ?? null,
        });
      }
    }

    if (!rows.length) {
      return this.shortlistEntryModel.findAll({
        where: {
          project_shortlist_id: projectShortlistId,
        },
        order: [
          ['sort_order', 'ASC'],
          ['created_at', 'ASC'],
        ],
      });
    }

    try {
      await this.shortlistEntryModel.bulkCreate(rows as any);
    } catch (error: any) {
      if (
        error?.name === 'SequelizeUniqueConstraintError' ||
        error?.parent?.code === 'ER_DUP_ENTRY'
      ) {
        // Another request may have seeded the same skeleton.
        // Return the final database state.
      } else {
        throw error;
      }
    }

    return this.shortlistEntryModel.findAll({
      where: {
        project_shortlist_id: projectShortlistId,
      },
      order: [
        ['sort_order', 'ASC'],
        ['created_at', 'ASC'],
      ],
    });
  }

  // ============================================================
  // FIND ALL
  // ============================================================

  async findAll(query: QueryProjectShortlistDto): Promise<ProjectShortlist[]> {
    const where: Record<string, any> = {};

    if (query.project_id) {
      where.project_id = query.project_id;
    }

    if (query.shortlist_type) {
      where.shortlist_type = query.shortlist_type;
    }

    return this.projectShortlistModel.findAll({
      where,

      include: [
        {
          model: ShortlistEntry,
          as: 'entries',
          include: [
            {
              association: 'vendor',
            },
            {
              association: 'material',
            },
          ],
        },
      ],

      order: [
        ['created_at', 'DESC'],
        [
          {
            model: ShortlistEntry,
            as: 'entries',
          },
          'sort_order',
          'ASC',
        ],
      ],
    });
  }

  // ============================================================
  // FIND ONE
  // ============================================================

  async findOne(id: string): Promise<ProjectShortlist> {
    const shortlist = await this.projectShortlistModel.findByPk(id, {
      include: [
        {
          model: ShortlistEntry,
          as: 'entries',
          include: [
            {
              association: 'vendor',
            },
            {
              association: 'material',
            },
          ],
        },
      ],

      order: [
        [
          {
            model: ShortlistEntry,
            as: 'entries',
          },
          'sort_order',
          'ASC',
        ],
      ],
    });

    if (!shortlist) {
      throw new NotFoundException(`ProjectShortlist ${id} not found`);
    }

    return shortlist;
  }

  // ============================================================
  // FIND BY PROJECT + TYPE
  // ============================================================

  async findByProjectAndType(
    projectId: string,
    type: ShortlistType,
  ): Promise<ProjectShortlist> {
    const shortlist = await this.projectShortlistModel.findOne({
      where: {
        project_id: projectId,
        shortlist_type: type,
      },

      include: [
        {
          model: ShortlistEntry,
          as: 'entries',
          include: [
            {
              association: 'vendor',
            },
            {
              association: 'material',
            },
          ],
        },
      ],

      order: [
        [
          {
            model: ShortlistEntry,
            as: 'entries',
          },
          'sort_order',
          'ASC',
        ],
      ],
    });

    if (!shortlist) {
      throw new NotFoundException(
        `No ${type} shortlist found for project ${projectId}`,
      );
    }

    return shortlist;
  }

  // ============================================================
  // UPDATE
  // ============================================================

  async update(
    id: string,
    dto: UpdateProjectShortlistDto,
    userId?: string,
  ): Promise<ProjectShortlist> {
    const shortlist = await this.findOne(id);

    /*
     * Locked means:
     *
     * - metadata cannot change
     * - entries cannot change
     *
     * Only an explicit unlock is allowed.
     */
    if (shortlist.is_locked && dto.is_locked !== false) {
      throw new BadRequestException('Shortlist is locked and cannot be edited');
    }

    await shortlist.update({
      ...dto,
      updated_by: userId ?? shortlist.updated_by,
    });

    return this.findOne(id);
  }

  // ============================================================
  // DELETE
  // ============================================================

  async remove(id: string): Promise<void> {
    const shortlist = await this.findOne(id);

    if (shortlist.is_locked) {
      throw new BadRequestException('Cannot delete a locked shortlist');
    }

    /*
     * Explicit deletion keeps this safe even when the existing
     * database foreign key does not have ON DELETE CASCADE.
     */
    await this.shortlistEntryModel.destroy({
      where: {
        project_shortlist_id: id,
      },
    });

    await shortlist.destroy();
  }

  // ============================================================
  // GRID VIEW
  // ============================================================

  async getGridView(id: string) {
    const shortlist = await this.findOne(id);

    const trades = Object.values(Trade);
    const workingTypes = Object.values(WorkingType);

    const entries = shortlist.entries ?? [];

    const grid = trades.map((trade, tradeIndex) => {
      const tradeEntries = entries.filter((entry) => entry.trade === trade);

      return {
        s_no: tradeIndex + 1,

        trade,

        rows: workingTypes.map((workingType) => {
          // Older databases can contain duplicate skeleton rows. Prefer the
          // populated, most recently edited row instead of hiding its assignment
          // behind the first empty row returned by the join.
          const candidates = tradeEntries.filter(
            (item) => item.working_type === workingType,
          );
          const entry = candidates.sort((a, b) => {
            const assigned = (item: ShortlistEntry) =>
              Number(Boolean(item.vendor_id || item.material_id || item.name_of_vendor?.trim()));
            return assigned(b) - assigned(a) ||
              new Date(b.updated_at ?? 0).getTime() - new Date(a.updated_at ?? 0).getTime() ||
              String(a.id).localeCompare(String(b.id));
          })[0];

          return {
            working_type: workingType,

            entry_id: entry?.id ?? null,

            name_of_vendor:
              entry?.name_of_vendor?.trim() ||
              entry?.vendor?.name ||
              entry?.material?.name ||
              null,

            vendor_id: entry?.vendor_id ?? null,

            material_id: entry?.material_id ?? null,

            estimate_value:
              entry?.estimate_value != null
                ? Number(entry.estimate_value)
                : null,

            quotation_value:
              entry?.quotation_value != null
                ? Number(entry.quotation_value)
                : null,

            currency: entry?.currency ?? 'INR',

            quotation_id: entry?.quotation_id ?? null,

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
