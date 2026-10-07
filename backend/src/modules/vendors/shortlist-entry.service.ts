import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/sequelize';

import { ShortlistEntry } from './models/shortlist-entry.model';
import { ProjectShortlist } from './models/project-shortlist.model';

import { CreateShortlistEntryDto } from './dto/create-shortlist-entry.dto';
import { UpdateShortlistEntryDto } from './dto/update-shortlist-entry.dto';
import { BulkCreateShortlistEntriesDto } from './dto/bulk-create-shortlist-entries.dto';
import { QueryShortlistEntryDto } from './dto/query-shortlist.dto';

import {
  ShortlistType,
  ShortlistEntryStatus,
  Trade,
  WorkingType,
} from '@/common/enums/shortlist.enums';

import { Op } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';

@Injectable()
export class ShortlistEntryService {
  constructor(
    private readonly sequelize: Sequelize,
    @InjectModel(ShortlistEntry)
    private readonly entryModel: typeof ShortlistEntry,

    @InjectModel(ProjectShortlist)
    private readonly shortlistModel: typeof ProjectShortlist,
  ) {}

  private assertCoordinates(trade: unknown, workingType: unknown): void {
    if (!Object.values(Trade).includes(trade as Trade) ||
        !Object.values(WorkingType).includes(workingType as WorkingType)) {
      throw new BadRequestException('A valid trade and working_type are required');
    }
  }

  async saveWorkspaceRow(shortlistId: string, dto: UpdateShortlistEntryDto & {
    trade: Trade; working_type: WorkingType; entry_id?: string;
  }, userId?: string): Promise<string> {
    this.assertCoordinates(dto.trade, dto.working_type);
    return this.sequelize.transaction(async transaction => {
      // Serializing on the parent prevents duplicate first edits and competing selections.
      const parent = await this.shortlistModel.findByPk(shortlistId, {
        transaction, lock: transaction.LOCK.UPDATE,
      });
      if (!parent) throw new NotFoundException('Shortlist not found');
      if (parent.is_locked) throw new BadRequestException('Shortlist is locked');
      this.validateEntryForShortlist(parent, dto);
      const { entry_id, ...patch } = dto;
      let existing = await this.entryModel.findOne({ where: {
        project_shortlist_id: shortlistId, trade: dto.trade, working_type: dto.working_type,
      }, transaction, order: [['updated_at', 'DESC'], ['id', 'ASC']] });
      if (entry_id) {
        const identified = await this.entryModel.findByPk(entry_id, { transaction });
        if (!identified || identified.project_shortlist_id !== shortlistId)
          throw new BadRequestException('Entry does not belong to this shortlist');
        if (existing && existing.id !== identified.id) {
          const emptySkeleton = !existing.vendor_id && !existing.material_id &&
            !existing.name_of_vendor?.trim() && existing.estimate_value == null &&
            existing.quotation_value == null && !existing.notes && !existing.quotation_id &&
            !existing.is_selected && existing.status === ShortlistEntryStatus.DRAFT;
          if (!emptySkeleton) throw new BadRequestException('This workspace row already has saved data. Choose an empty row.');
          await existing.destroy({ transaction });
        }
        existing = identified;
      }
      const values: any = { ...patch, updated_by: userId ?? null };
      if ((patch.is_selected === true && patch.status !== undefined && patch.status !== ShortlistEntryStatus.SELECTED) ||
          (patch.is_selected === false && patch.status === ShortlistEntryStatus.SELECTED))
        throw new BadRequestException('Selection flag and status conflict');
      if (patch.is_selected === true || patch.status === ShortlistEntryStatus.SELECTED) {
        values.is_selected = true;
        values.status = ShortlistEntryStatus.SELECTED;
        await this.entryModel.update({ is_selected: false, status: ShortlistEntryStatus.SHORTLISTED }, {
          where: { project_shortlist_id: shortlistId, trade: dto.trade,
            [Op.or]: [{ is_selected: true }, { status: ShortlistEntryStatus.SELECTED }] }, transaction,
        });
      } else if (patch.status !== undefined) values.is_selected = false;
      else if (patch.is_selected === false && existing?.status === ShortlistEntryStatus.SELECTED)
        values.status = ShortlistEntryStatus.SHORTLISTED;
      const saved = existing
        ? await existing.update(values, { transaction })
        : await this.entryModel.create({ ...values, project_shortlist_id: shortlistId, created_by: userId ?? null }, { transaction });
      await saved.reload({ transaction });
      // MySQL in non-strict mode can silently coerce incompatible ENUMs to ''.
      // Roll back rather than reporting a successful, invisible save.
      if (saved.trade !== dto.trade || saved.working_type !== dto.working_type ||
          (values.status !== undefined && saved.status !== values.status))
        throw new BadRequestException('Shortlist database schema is outdated. Apply 20261007_shortlist_workspace.sql before saving.');
      return saved.id;
    });
  }

  // ============================================================
  // ASSERT SHORTLIST EXISTS + EDITABLE
  // ============================================================

  private async assertShortlistEditable(
    shortlistId: string,
  ): Promise<ProjectShortlist> {
    const shortlist = await this.shortlistModel.findByPk(shortlistId);

    if (!shortlist) {
      throw new NotFoundException(`ProjectShortlist ${shortlistId} not found`);
    }

    if (shortlist.is_locked) {
      throw new BadRequestException('Shortlist is locked');
    }

    return shortlist;
  }

  // ============================================================
  // VALIDATE ENTRY AGAINST SHORTLIST TYPE
  // ============================================================

  private validateEntryForShortlist(
    shortlist: ProjectShortlist,
    dto: {
      vendor_id?: string | null;
      material_id?: string | null;
    },
  ): void {
    if (shortlist.shortlist_type === ShortlistType.VENDOR) {
      if (dto.material_id) {
        throw new BadRequestException(
          'Material cannot be assigned to a VENDOR shortlist entry',
        );
      }
    }

    if (shortlist.shortlist_type === ShortlistType.MATERIAL) {
      if (dto.vendor_id) {
        throw new BadRequestException(
          'Vendor cannot be assigned to a MATERIAL shortlist entry',
        );
      }
    }
  }

  // ============================================================
  // CREATE
  // ============================================================

  async create(
    dto: CreateShortlistEntryDto,
    userId?: string,
  ): Promise<ShortlistEntry> {
    const { project_shortlist_id, ...patch } = dto;
    const id = await this.saveWorkspaceRow(project_shortlist_id, patch, userId);
    return this.findOne(id);
  }

  // ============================================================
  // BULK CREATE
  // ============================================================

  async bulkCreate(
    dto: BulkCreateShortlistEntriesDto,
    userId?: string,
  ): Promise<ShortlistEntry[]> {
    const shortlist = await this.assertShortlistEditable(
      dto.project_shortlist_id,
    );

    for (const entry of dto.entries) {
      this.assertCoordinates(entry.trade, entry.working_type);
      this.validateEntryForShortlist(shortlist, entry);
    }

    /*
     * Validate duplicates inside request itself.
     */
    const requestKeys = new Set<string>();

    for (const entry of dto.entries) {
      const key = `${entry.trade}::${entry.working_type}`;

      if (requestKeys.has(key)) {
        throw new BadRequestException(
          `Duplicate entry in request: ${entry.trade} / ${entry.working_type}`,
        );
      }

      requestKeys.add(key);
    }

    await this.sequelize.transaction(async transaction => {
      const parent = await this.shortlistModel.findByPk(dto.project_shortlist_id, {
        transaction, lock: transaction.LOCK.UPDATE,
      });
      if (!parent) throw new NotFoundException('Shortlist not found');
      if (parent.is_locked) throw new BadRequestException('Shortlist is locked');
      const selectedTrades = new Set<string>();
      for (const patch of dto.entries) {
        this.validateEntryForShortlist(parent, patch);
        if ((patch.is_selected === true && patch.status !== undefined && patch.status !== ShortlistEntryStatus.SELECTED) ||
            (patch.is_selected === false && patch.status === ShortlistEntryStatus.SELECTED)) {
          throw new BadRequestException('Selection flag and status conflict');
        }
        const selected = patch.is_selected === true || patch.status === ShortlistEntryStatus.SELECTED;
        if (selected && selectedTrades.has(patch.trade)) throw new BadRequestException('Only one entry per trade can be selected');
        if (selected) selectedTrades.add(patch.trade);
        const existing = await this.entryModel.findOne({ where: {
          project_shortlist_id: parent.id, trade: patch.trade, working_type: patch.working_type,
        }, transaction });
        const values = { ...patch, updated_by: userId ?? null };
        if (selected) { values.is_selected = true; values.status = ShortlistEntryStatus.SELECTED; }
        else if (patch.status !== undefined) values.is_selected = false;
        else if (patch.is_selected === false && existing?.status === ShortlistEntryStatus.SELECTED) values.status = ShortlistEntryStatus.SHORTLISTED;
        if (selected) await this.entryModel.update({ is_selected: false, status: ShortlistEntryStatus.SHORTLISTED }, {
          where: { project_shortlist_id: parent.id, trade: patch.trade, status: ShortlistEntryStatus.SELECTED }, transaction,
        });
        if (existing) await existing.update(values, { transaction });
        else await this.entryModel.create({ ...values, project_shortlist_id: parent.id, created_by: userId ?? null }, { transaction });
      }
    });

    return this.findAll({
      project_shortlist_id: dto.project_shortlist_id,
    } as QueryShortlistEntryDto);
  }

  // ============================================================
  // FIND ALL
  // ============================================================

  async findAll(query: QueryShortlistEntryDto): Promise<ShortlistEntry[]> {
    const where: Record<string, any> = {};

    if (query.project_shortlist_id) {
      where.project_shortlist_id = query.project_shortlist_id;
    }

    if (query.trade) {
      where.trade = query.trade;
    }

    if (query.working_type) {
      where.working_type = query.working_type;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.vendor_id) {
      where.vendor_id = query.vendor_id;
    }

    if (query.material_id) {
      where.material_id = query.material_id;
    }

    return this.entryModel.findAll({
      where,

      include: [
        {
          association: 'vendor',
        },
        {
          association: 'material',
        },
        {
          association: 'projectShortlist',
        },
      ],

      order: [
        ['sort_order', 'ASC'],
        ['created_at', 'ASC'],
      ],
    });
  }

  // ============================================================
  // FIND ONE
  // ============================================================

  async findOne(id: string): Promise<ShortlistEntry> {
    const entry = await this.entryModel.findByPk(id, {
      include: [
        {
          association: 'vendor',
        },
        {
          association: 'material',
        },
        {
          association: 'projectShortlist',
        },
      ],
    });

    if (!entry) {
      throw new NotFoundException(`ShortlistEntry ${id} not found`);
    }

    return entry;
  }

  // ============================================================
  // UPDATE
  // ============================================================

  async update(
    id: string,
    dto: UpdateShortlistEntryDto,
    userId?: string,
  ): Promise<ShortlistEntry> {
    const entry = await this.findOne(id);

    const shortlist = await this.assertShortlistEditable(
      entry.project_shortlist_id,
    );

    this.assertCoordinates(dto.trade ?? entry.trade, dto.working_type ?? entry.working_type);

    this.validateEntryForShortlist(shortlist, dto);

    /*
     * If the row is being moved to another trade/working type,
     * ensure that combination doesn't already exist.
     */
    if (dto.trade !== undefined || dto.working_type !== undefined) {
      const nextTrade = dto.trade ?? entry.trade;
      const nextWorkingType = dto.working_type ?? entry.working_type;

      const duplicate = await this.entryModel.findOne({
        where: {
          project_shortlist_id: entry.project_shortlist_id,

          trade: nextTrade,

          working_type: nextWorkingType,

          id: {
            [Op.ne]: entry.id,
          },
        },
      });

      if (duplicate) {
        throw new BadRequestException(
          `An entry already exists for ${nextTrade} / ${nextWorkingType}`,
        );
      }
    }

    /*
     * If the entry is selected, don't allow normal update logic
     * to accidentally leave is_selected/status inconsistent.
     */
    const updatePayload: any = {
      ...dto,
      updated_by: userId ?? entry.updated_by,
    };

    if (dto.is_selected === true || dto.status === ShortlistEntryStatus.SELECTED) {
      updatePayload.is_selected = true;
      updatePayload.status = ShortlistEntryStatus.SELECTED;
    }

    if (dto.status !== undefined && dto.status !== ShortlistEntryStatus.SELECTED) {
      updatePayload.is_selected = false;
    }

    if ((dto.is_selected === true && dto.status !== undefined && dto.status !== ShortlistEntryStatus.SELECTED) ||
        (dto.is_selected === false && dto.status === ShortlistEntryStatus.SELECTED)) {
      throw new BadRequestException('Selection flag and status conflict');
    }

    if (dto.is_selected === false) {
      if (entry.status === ShortlistEntryStatus.SELECTED && dto.status === undefined) {
        updatePayload.status = ShortlistEntryStatus.SHORTLISTED;
      }
    }

    await entry.update(updatePayload);

    /*
     * Selecting through normal update should have the same
     * sibling behavior as selectEntry().
     */
    if (updatePayload.is_selected === true) {
      await this.unselectSiblings(entry, userId);
    }

    return this.findOne(id);
  }

  // ============================================================
  // UNSELECT SIBLINGS
  // ============================================================

  private async unselectSiblings(
    entry: ShortlistEntry,
    userId?: string,
  ): Promise<void> {
    await this.entryModel.update(
      {
        is_selected: false,

        updated_by: userId ?? entry.updated_by,
      },

      {
        where: {
          project_shortlist_id: entry.project_shortlist_id,

          trade: entry.trade,

          id: {
            [Op.ne]: entry.id,
          },

          is_selected: true,
        },
      },
    );

    /*
     * Don't leave siblings with SELECTED status.
     */
    await this.entryModel.update(
      {
        status: ShortlistEntryStatus.SHORTLISTED,

        updated_by: userId ?? entry.updated_by,
      },

      {
        where: {
          project_shortlist_id: entry.project_shortlist_id,

          trade: entry.trade,

          id: {
            [Op.ne]: entry.id,
          },

          status: ShortlistEntryStatus.SELECTED,
        },
      },
    );
  }

  // ============================================================
  // SELECT ENTRY
  // ============================================================

  async selectEntry(
    id: string,
    unselectSiblings = true,
    userId?: string,
  ): Promise<ShortlistEntry> {
    const entry = await this.findOne(id);

    await this.assertShortlistEditable(entry.project_shortlist_id);

    if (unselectSiblings) {
      await this.unselectSiblings(entry, userId);
    }

    await entry.update({
      is_selected: true,

      status: ShortlistEntryStatus.SELECTED,

      updated_by: userId ?? entry.updated_by,
    });

    return this.findOne(id);
  }

  // ============================================================
  // REMOVE
  // ============================================================

  async remove(id: string): Promise<void> {
    const entry = await this.findOne(id);

    await this.assertShortlistEditable(entry.project_shortlist_id);

    await entry.destroy();
  }
}
