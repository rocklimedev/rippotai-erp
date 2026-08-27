import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UniqueConstraintError } from 'sequelize';
import { DocumentRequirement } from './models/document-requirement.model';
import { DocumentType } from './models/document-type.model';
import { CreateDocumentRequirementDto } from './dto/create-document-requirement.dto';
import { UpdateDocumentRequirementDto } from './dto/update-document-requirement.dto';

@Injectable()
export class DocumentRequirementsService {
  constructor(
    @InjectModel(DocumentRequirement)
    private readonly requirementModel: typeof DocumentRequirement,
  ) {}

  async create(
    dto: CreateDocumentRequirementDto,
  ): Promise<DocumentRequirement> {
    try {
      return await this.requirementModel.create({ ...dto } as any);
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        throw new ConflictException(
          'A requirement for this document type already exists on this project',
        );
      }
      throw error;
    }
  }

  async findAllForProject(projectId: string): Promise<DocumentRequirement[]> {
    return this.requirementModel.findAll({
      where: { projectId },
      include: [{ model: DocumentType }],
      order: [
        [{ model: DocumentType, as: 'documentType' }, 'phaseCode', 'ASC'],
        [{ model: DocumentType, as: 'documentType' }, 'sequence', 'ASC'],
      ],
    });
  }

  async findOne(id: string): Promise<DocumentRequirement> {
    const requirement = await this.requirementModel.findByPk(id, {
      include: [{ model: DocumentType }],
    });

    if (!requirement) {
      throw new NotFoundException(`Document requirement ${id} not found`);
    }

    return requirement;
  }

  async update(
    id: string,
    dto: UpdateDocumentRequirementDto,
  ): Promise<DocumentRequirement> {
    const requirement = await this.findOne(id);
    return requirement.update({ ...dto });
  }

  async markCompleted(
    id: string,
    isCompleted: boolean,
  ): Promise<DocumentRequirement> {
    const requirement = await this.findOne(id);

    return requirement.update({
      isCompleted,
      completedAt: isCompleted ? new Date() : null,
    });
  }

  async remove(id: string): Promise<void> {
    const requirement = await this.findOne(id);
    await requirement.destroy();
  }
}
