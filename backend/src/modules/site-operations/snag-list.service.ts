import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { SnagList, SnagListRevision } from './models/snag-list.model';
import { Project } from '../projects/models/projects.model';
import { SnagListExportService } from './snag-list-export.service';
import {
  CreateSnagListDto,
  UpdateSnagListDto,
  QuerySnagListDto,
} from './dto/snag-list.dto';
import { SnagStatus } from '@/common/enums/architect-visit.enums';

@Injectable()
export class SnagListService {
  constructor(
    @InjectModel(SnagList) private readonly model: typeof SnagList,
    @InjectModel(SnagListRevision)
    private readonly revisions: typeof SnagListRevision,
    @InjectModel(Project) private readonly projects: typeof Project,
    private readonly exporter: SnagListExportService,
  ) {}
  private async values(dto: CreateSnagListDto, revision: number) {
    const project = await this.projects.findByPk(dto.project_id);
    if (!project) throw new NotFoundException('Project not found');
    if (!dto.items?.length || dto.items.some((i) => !i.observation?.trim()))
      throw new BadRequestException('Each snag row requires an observation');
    const items = dto.items.map((i, index) => ({
      s_no: index + 1,
      floor: i.floor?.trim() || '',
      room: i.room?.trim() || '',
      category: i.category?.trim() || '',
      observation: i.observation.trim(),
      photos: i.photos || [],
      scope: i.scope?.trim() || '',
      status: i.status,
      remarks: i.remarks?.trim() || '',
    }));
    const values = {
      project_id: project.id,
      project_name: project.name,
      title: dto.title.trim(),
      document_date: dto.document_date,
      revision,
      items,
      item_count: items.length,
      open_count: items.filter((i) => i.status !== SnagStatus.CLOSED).length,
    };
    return { ...values, excel_data: await this.exporter.build(values) };
  }
  private async archive(
    row: SnagList,
    userId: string | undefined,
    transaction: any,
  ) {
    const { excel_data, ...document } = row.toJSON();
    await this.revisions.create(
      {
        snag_list_id: row.id,
        revision: row.revision,
        document,
        excel_data,
        created_by: userId || null,
      } as any,
      { transaction },
    );
  }
  async create(dto: CreateSnagListDto, userId?: string) {
    const values = await this.values(dto, 1);
    const id = await this.model.sequelize!.transaction(async (transaction) => {
      const row = await this.model.create(
        { ...values, created_by: userId || null } as any,
        { transaction },
      );
      await this.archive(row, userId, transaction);
      return row.id;
    });
    return this.findOne(id);
  }
  async update(id: string, dto: UpdateSnagListDto, userId?: string) {
    const values = await this.values(dto, dto.revision + 1);
    await this.model.sequelize!.transaction(async (transaction) => {
      const row = await this.model.findByPk(id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!row) throw new NotFoundException('Snag list not found');
      if (row.revision !== dto.revision)
        throw new ConflictException(
          'This snag list has changed. Reload before saving your edits.',
        );
      if (row.project_id !== dto.project_id)
        throw new BadRequestException(
          'The project of a saved snag list cannot be changed',
        );
      await row.update({ ...values, updated_by: userId || null } as any, {
        transaction,
      });
      await this.archive(row, userId, transaction);
    });
    return this.findOne(id);
  }
  async list(query: QuerySnagListDto) {
    const where: any = {};
    if (query.project_id) where.project_id = query.project_id;
    if (query.search)
      where[Op.or] = [
        { title: { [Op.like]: `%${query.search}%` } },
        { project_name: { [Op.like]: `%${query.search}%` } },
      ];
    const page = query.page || 1,
      limit = query.limit || 20;
    const { rows, count } = await this.model.findAndCountAll({
      where,
      attributes: { exclude: ['items', 'excel_data'] },
      order: [
        ['document_date', 'DESC'],
        ['updated_at', 'DESC'],
        ['id', 'DESC'],
      ],
      limit,
      offset: (page - 1) * limit,
    });
    return {
      data: rows,
      meta: { total: count, page, total_pages: Math.ceil(count / limit) },
    };
  }
  async findOne(id: string) {
    const row = await this.model.findByPk(id, {
      attributes: { exclude: ['excel_data'] },
    });
    if (!row) throw new NotFoundException('Snag list not found');
    return row;
  }
  async download(id: string) {
    const row = await this.model.findByPk(id, {
      attributes: ['id', 'revision', 'excel_data'],
    });
    if (!row) throw new NotFoundException('Snag list not found');
    return row;
  }
}
