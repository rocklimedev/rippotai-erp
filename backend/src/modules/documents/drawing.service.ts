import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Drawing } from './models/drawing.model';
import { Project } from '@/modules/projects/models/projects.model';
import { CdnService } from '@/modules/cdn/cdn.service';
import { UploadDrawingDto } from './dto/upload-drawing.dto';
import { User } from '@/modules/users/models/user.model';

@Injectable()
export class DrawingsService {
  constructor(
    @InjectModel(Drawing) private readonly drawingModel: typeof Drawing,
    private readonly cdnService: CdnService,
  ) {}

  async findAll() {
    const rows = await this.drawingModel.findAll({
      include: [{ model: Project, attributes: ['id', 'name'] }],
      order: [
        ['drawingNumber', 'ASC'],
        ['createdAt', 'DESC'],
      ],
    });
    return rows.map((r) => ({
      ...r.toJSON(),
      project_name: (r as any).project?.name || null,
    }));
  }

  async create(dto: UploadDrawingDto, file: Express.Multer.File, user?: User) {
    if (!file) throw new BadRequestException('file is required');

    // Any earlier revisions of the same drawing number, on the same
    // project, that are not already superseded get marked as such —
    // this is what the "revisions preserved" / "history is preserved"
    // copy in the UI refers to.
    await this.drawingModel.update(
      { status: 'superseded' },
      {
        where: {
          projectId: dto.project_id,
          drawingNumber: dto.drawing_number,
        },
      },
    );

    const { filename: storageFilename, url } =
      await this.cdnService.uploadFile(file);

    return this.drawingModel.create({
      projectId: dto.project_id,
      title: dto.title,
      drawingNumber: dto.drawing_number,
      discipline: dto.discipline || null,
      revision: dto.revision || 'R1',
      issueDate: dto.issue_date || null,
      issuePurpose: dto.issue_purpose || null,
      status: dto.status || 'Draft',
      remarks: dto.remarks || null,
      filename: file.originalname,
      storageFilename,
      url,
      mime: file.mimetype,
      size: file.size,
      uploadedBy: user?.id || null,
    } as any);
  }
}
