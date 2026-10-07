import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, literal } from 'sequelize';
import { AdminDprDocument } from './models/admin-dpr-document.model';
import { AdminDprExportService } from './admin-dpr-export.service';
import { QueryAdminDailyReportDto } from './dto/admin-daily-report.dto';

@Injectable()
export class AdminDprDocumentService {
  constructor(
    @InjectModel(AdminDprDocument)
    private readonly model: typeof AdminDprDocument,
    private readonly exporter: AdminDprExportService,
  ) {}

  async create(
    query: QueryAdminDailyReportDto,
    user?: { id?: string; name?: string },
  ) {
    const { reports, logs } = await this.exporter.capture(query);
    const excel_data = Buffer.from(
      await this.exporter.buildWorkbook(reports, logs),
    );
    const entries = [...reports, ...logs];
    const project_ids = [
      ...new Set(entries.map((r) => r.project_id).filter(Boolean)),
    ];
    if (query.project_id && !project_ids.includes(query.project_id))
      project_ids.push(query.project_id);
    const project_names = [
      ...new Set(entries.map((r) => r.project?.name).filter(Boolean)),
    ];
    const dates = entries
      .map((r) => r.report_date || r.log_date)
      .filter(Boolean)
      .sort();
    const from_date = query.date || query.from_date || dates[0] || null;
    const to_date =
      query.date || query.to_date || dates[dates.length - 1] || null;
    const title = `Admin DPR · ${project_names.join(', ') || (query.project_id ? 'Selected project' : 'All projects')} · ${from_date || 'All dates'}${to_date && to_date !== from_date ? ` to ${to_date}` : ''}`;
    const row = await this.model.create({
      title: title.slice(0, 255),
      project_id: query.project_id || null,
      project_ids,
      project_names,
      from_date,
      to_date,
      filters: {
        project_id: query.project_id || null,
        date: query.date || null,
        from_date: query.from_date || null,
        to_date: query.to_date || null,
        work_status: query.work_status || null,
        has_blockers: query.has_blockers || false,
        search: query.search || null,
      },
      reports,
      logs,
      report_count: reports.length,
      log_count: logs.length,
      filename: `admin-dpr-${from_date || 'all-dates'}-${Date.now()}.xlsx`,
      excel_data,
      created_by: user?.id || null,
      created_by_name: user?.name || null,
    } as any);
    return this.findOne(row.id);
  }

  async list(query: QueryAdminDailyReportDto) {
    const where: any = {};
    if (query.project_id) {
      const escaped = this.model.sequelize!.escape(
        JSON.stringify(query.project_id),
      );
      where[Op.and] = [literal(`JSON_CONTAINS(project_ids, ${escaped})`)];
    }
    if (query.search) where.title = { [Op.like]: `%${query.search}%` };
    const page = query.page || 1;
    const limit = query.limit || 20;
    const { rows, count } = await this.model.findAndCountAll({
      where,
      attributes: { exclude: ['excel_data', 'reports', 'logs'] },
      order: [
        ['created_at', 'DESC'],
        ['id', 'DESC'],
      ],
      limit,
      offset: (page - 1) * limit,
    });
    return {
      data: rows,
      meta: {
        total: count,
        page,
        limit,
        total_pages: Math.ceil(count / limit),
      },
    };
  }

  async findOne(id: string) {
    const row = await this.model.findByPk(id, {
      attributes: { exclude: ['excel_data'] },
    });
    if (!row) throw new NotFoundException('Saved DPR not found');
    return row;
  }

  async download(id: string) {
    const row = await this.model.findByPk(id, {
      attributes: ['id', 'filename', 'excel_data'],
    });
    if (!row) throw new NotFoundException('Saved DPR not found');
    return row;
  }
}
