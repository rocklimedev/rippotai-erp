import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UniqueConstraintError } from 'sequelize';

import { DocumentType } from './models/document-type.model';
import { ProjectPhase } from '../projects/models/project-phase.model';

import { CreateDocumentTypeDto } from './dto/create-document-type.dto';
import { UpdateDocumentTypeDto } from './dto/update-document-type.dto';

@Injectable()
export class DocumentTypesService {
  constructor(
    @InjectModel(DocumentType)
    private readonly documentTypeModel: typeof DocumentType,

    @InjectModel(ProjectPhase)
    private readonly projectPhaseModel: typeof ProjectPhase,
  ) {}

  /**
   * Validate that the supplied project phase exists
   * and belongs to the DOCUMENTS module.
   */
  private async validateProjectPhase(projectPhaseId: string) {
    const projectPhase = await this.projectPhaseModel.findOne({
      where: {
        id: projectPhaseId,
        module: 'DOCUMENTS',
      },
    });

    if (!projectPhase) {
      throw new BadRequestException(
        `Invalid document project phase "${projectPhaseId}"`,
      );
    }

    return projectPhase;
  }

  async create(dto: CreateDocumentTypeDto): Promise<DocumentType> {
    try {
      if (dto.projectPhaseId) {
        const projectPhase = await this.validateProjectPhase(
          dto.projectPhaseId,
        );

        return await this.documentTypeModel.create({
          ...dto,
          phaseCode: projectPhase.phase_code,
          phaseName: projectPhase.title,
        } as any);
      }

      throw new BadRequestException(
        'projectPhaseId is required when creating a document type',
      );
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        throw new ConflictException(
          `Document type with code "${dto.code}" already exists`,
        );
      }

      throw error;
    }
  }

  async findAll(params: {
    phaseCode?: string;
    projectPhaseId?: string;
    targetType?: string;
    isActive?: boolean;
  }): Promise<DocumentType[]> {
    const where: Record<string, unknown> = {};

    if (params.phaseCode) {
      where.phaseCode = params.phaseCode;
    }

    if (params.projectPhaseId) {
      where.projectPhaseId = params.projectPhaseId;
    }

    if (params.targetType) {
      where.targetType = params.targetType;
    }

    if (params.isActive !== undefined) {
      where.isActive = params.isActive;
    }

    return this.documentTypeModel.findAll({
      where,
      include: [
        {
          model: ProjectPhase,
          as: 'projectPhase',
          required: false,
        },
      ],
      order: [['sequence', 'ASC']],
    });
  }

  async findOne(id: string): Promise<DocumentType> {
    const documentType = await this.documentTypeModel.findByPk(id, {
      include: [
        {
          model: ProjectPhase,
          as: 'projectPhase',
          required: false,
        },
      ],
    });

    if (!documentType) {
      throw new NotFoundException(`Document type ${id} not found`);
    }

    return documentType;
  }

  async update(id: string, dto: UpdateDocumentTypeDto): Promise<DocumentType> {
    const documentType = await this.findOne(id);

    try {
      if (dto.projectPhaseId) {
        const projectPhase = await this.validateProjectPhase(
          dto.projectPhaseId,
        );

        await documentType.update({
          ...dto,
          phaseCode: projectPhase.phase_code,
          phaseName: projectPhase.title,
        } as any);
      } else {
        await documentType.update({
          ...dto,
        } as any);
      }

      return await this.findOne(id);
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        throw new ConflictException(
          `Document type with code "${dto.code}" already exists`,
        );
      }

      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const documentType = await this.findOne(id);

    await documentType.destroy();
  }
}
