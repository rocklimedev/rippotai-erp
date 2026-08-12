import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UniqueConstraintError } from 'sequelize';
import { DailySiteReport } from './models/daily-site-report.model';
import { CreateDailySiteReportDto } from './dto/create-daily-site-report.dto';
import { UpdateDailySiteReportDto } from './dto/update-daily-site-report.dto';

@Injectable()
export class DailySiteReportsService {
  constructor(
    @InjectModel(DailySiteReport)
    private readonly reportModel: typeof DailySiteReport,
  ) {}

  async create(dto: CreateDailySiteReportDto): Promise<DailySiteReport> {
    try {
      return await this.reportModel.create({ ...dto } as any);
    } catch (err) {
      if (err instanceof UniqueConstraintError) {
        throw new ConflictException(
          `A daily site report already exists for project ${dto.projectId} on ${dto.reportDate}`,
        );
      }
      throw err;
    }
  }

  async findAll(projectId?: string): Promise<DailySiteReport[]> {
    return this.reportModel.findAll({
      where: projectId ? { projectId } : undefined,
      order: [['reportDate', 'DESC']],
    });
  }

  async findOne(id: string): Promise<DailySiteReport> {
    const report = await this.reportModel.findByPk(id);
    if (!report) {
      throw new NotFoundException(`Daily site report ${id} not found`);
    }
    return report;
  }

  async update(
    id: string,
    dto: UpdateDailySiteReportDto,
  ): Promise<DailySiteReport> {
    const report = await this.findOne(id);
    return report.update({ ...dto });
  }

  async remove(id: string): Promise<void> {
    const report = await this.findOne(id);
    await report.destroy();
  }
}
