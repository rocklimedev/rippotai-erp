import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { SiteVisitLog } from './models/site-visit-log.model';
import { CreateSiteVisitLogDto } from './dto/create-site-visit-log.dto';
import { UpdateSiteVisitLogDto } from './dto/update-site-visit-log.dto';

@Injectable()
export class SiteVisitLogsService {
  constructor(
    @InjectModel(SiteVisitLog)
    private readonly visitLogModel: typeof SiteVisitLog,
  ) {}

  async create(dto: CreateSiteVisitLogDto): Promise<SiteVisitLog> {
    return this.visitLogModel.create({
      ...dto,
      visitedAt: new Date(dto.visitedAt),
    });
  }

  async findAll(projectId?: string): Promise<SiteVisitLog[]> {
    return this.visitLogModel.findAll({
      where: projectId ? { projectId } : undefined,
      order: [['visitedAt', 'DESC']],
    });
  }

  async findOne(id: string): Promise<SiteVisitLog> {
    const log = await this.visitLogModel.findByPk(id);

    if (!log) {
      throw new NotFoundException(`Site visit log ${id} not found`);
    }

    return log;
  }

  async update(id: string, dto: UpdateSiteVisitLogDto): Promise<SiteVisitLog> {
    const log = await this.findOne(id);

    return log.update({
      ...dto,
      ...(dto.visitedAt !== undefined && {
        visitedAt: new Date(dto.visitedAt),
      }),
    });
  }

  async remove(id: string): Promise<void> {
    const log = await this.findOne(id);
    await log.destroy();
  }
}
