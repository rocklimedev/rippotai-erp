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
import { ShortlistType } from '@/common/enums/shortlist.enums';
import { Op } from 'sequelize';

@Injectable()
export class ShortlistEntryService {
  constructor(
    @InjectModel(ShortlistEntry)
    private readonly entryModel: typeof ShortlistEntry,
    @InjectModel(ProjectShortlist)
    private readonly shortlistModel: typeof ProjectShortlist,
  ) {}

  private async assertShortlistEditable(shortlistId: string) {
    const shortlist = await this.shortlistModel.findByPk(shortlistId);
    if (!shortlist) {
      throw new NotFoundException(`ProjectShortlist ${shortlistId} not found`);
    }
    if (shortlist.is_locked) {
      throw new BadRequestException('Shortlist is locked');
    }
    return shortlist;
  }

  async create(
    dto: CreateShortlistEntryDto,
    userId?: string,
  ): Promise<ShortlistEntry> {
    const shortlist = await this.assertShortlistEditable(
      dto.project_shortlist_id,
    );

    // Light validation based on shortlist type
    if (shortlist.shortlist_type === ShortlistType.VENDOR && !dto.vendor_id) {
      // Allow empty skeleton rows; only warn if you want strict mode
    }
    if (
      shortlist.shortlist_type === ShortlistType.MATERIAL &&
      !dto.material_id
    ) {
      // same
    }

    return this.entryModel.create({
      ...dto,
      created_by: userId ?? null,
      updated_by: userId ?? null,
    });
  }

  async bulkCreate(
    dto: BulkCreateShortlistEntriesDto,
    userId?: string,
  ): Promise<ShortlistEntry[]> {
    await this.assertShortlistEditable(dto.project_shortlist_id);

    const rows = dto.entries.map((e) => ({
      ...e,
      project_shortlist_id: dto.project_shortlist_id,
      created_by: userId ?? null,
      updated_by: userId ?? null,
    }));

    return this.entryModel.bulkCreate(rows as any);
  }

  async findAll(query: QueryShortlistEntryDto): Promise<ShortlistEntry[]> {
    const where: any = {};
    if (query.project_shortlist_id)
      where.project_shortlist_id = query.project_shortlist_id;
    if (query.trade) where.trade = query.trade;
    if (query.working_type) where.working_type = query.working_type;
    if (query.status) where.status = query.status;
    if (query.vendor_id) where.vendor_id = query.vendor_id;
    if (query.material_id) where.material_id = query.material_id;

    return this.entryModel.findAll({
      where,
      include: ['vendor', 'material', 'projectShortlist'],
      order: [['sort_order', 'ASC']],
    });
  }

  async findOne(id: string): Promise<ShortlistEntry> {
    const entry = await this.entryModel.findByPk(id, {
      include: ['vendor', 'material', 'projectShortlist'],
    });
    if (!entry) {
      throw new NotFoundException(`ShortlistEntry ${id} not found`);
    }
    return entry;
  }

  async update(
    id: string,
    dto: UpdateShortlistEntryDto,
    userId?: string,
  ): Promise<ShortlistEntry> {
    const entry = await this.findOne(id);
    await this.assertShortlistEditable(entry.project_shortlist_id);

    await entry.update({
      ...dto,
      updated_by: userId ?? entry.updated_by,
    });
    return this.findOne(id);
  }

  /**
   * Mark one entry as selected for its trade; optionally unselect siblings.
   */
  async selectEntry(
    id: string,
    unselectSiblings = true,
    userId?: string,
  ): Promise<ShortlistEntry> {
    const entry = await this.findOne(id);
    await this.assertShortlistEditable(entry.project_shortlist_id);

    if (unselectSiblings) {
      await this.entryModel.update(
        { is_selected: false, updated_by: userId ?? null },
        {
          where: {
            project_shortlist_id: entry.project_shortlist_id,
            trade: entry.trade,
            id: { [Op.ne]: id },
          },
        },
      );
    }

    await entry.update({
      is_selected: true,
      status: 'SELECTED' as any,
      updated_by: userId ?? entry.updated_by,
    });
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const entry = await this.findOne(id);
    await this.assertShortlistEditable(entry.project_shortlist_id);
    await entry.destroy();
  }
}
