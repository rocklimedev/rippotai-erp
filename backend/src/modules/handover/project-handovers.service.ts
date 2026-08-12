import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UniqueConstraintError } from 'sequelize';
import { ProjectHandover } from './models/project-handover.model';
import { CreateProjectHandoverDto } from './dto/create-project-handover.dto';
import { UpdateProjectHandoverDto } from './dto/update-project-handover.dto';
import { SignOffProjectHandoverDto } from './dto/sign-off-project-handover.dto';

@Injectable()
export class ProjectHandoversService {
  constructor(
    @InjectModel(ProjectHandover)
    private readonly handoverModel: typeof ProjectHandover,
  ) {}

  async create(dto: CreateProjectHandoverDto): Promise<ProjectHandover> {
    try {
      return await this.handoverModel.create({ ...dto } as any);
    } catch (err) {
      if (err instanceof UniqueConstraintError) {
        throw new ConflictException(
          `A handover record already exists for project ${dto.projectId}`,
        );
      }
      throw err;
    }
  }

  async findAll(): Promise<ProjectHandover[]> {
    return this.handoverModel.findAll({ order: [['createdAt', 'DESC']] });
  }

  async findOne(id: string): Promise<ProjectHandover> {
    const handover = await this.handoverModel.findByPk(id);
    if (!handover) {
      throw new NotFoundException(`Project handover ${id} not found`);
    }
    return handover;
  }

  async findByProject(projectId: string): Promise<ProjectHandover> {
    const handover = await this.handoverModel.findOne({
      where: { projectId },
    });
    if (!handover) {
      throw new NotFoundException(
        `No handover record found for project ${projectId}`,
      );
    }
    return handover;
  }

  async update(
    id: string,
    dto: UpdateProjectHandoverDto,
  ): Promise<ProjectHandover> {
    const handover = await this.findOne(id);
    return handover.update({ ...dto });
  }

  /**
   * Client sign-off. Requires the core handover documents to already
   * be attached, since sign-off should mean the package is complete.
   */
  async signOff(
    id: string,
    dto: SignOffProjectHandoverDto,
  ): Promise<ProjectHandover> {
    const handover = await this.findOne(id);

    const missingDocs = [
      ['completion certificate', handover.completionCertificateDocumentId],
      ['warranty pack', handover.warrantyPackDocumentId],
      ['as-built drawings', handover.asBuiltDrawingDocumentId],
    ].filter(([, docId]) => !docId);

    if (missingDocs.length > 0) {
      throw new BadRequestException(
        `Cannot sign off — missing: ${missingDocs.map(([label]) => label).join(', ')}`,
      );
    }

    return handover.update({
      clientSignedOffBy: dto.clientSignedOffBy,
      clientSignedOffAt: new Date(),
    });
  }

  async remove(id: string): Promise<void> {
    const handover = await this.findOne(id);
    await handover.destroy();
  }
}
