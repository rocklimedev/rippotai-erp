import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UniqueConstraintError } from 'sequelize';
import { DocumentType } from './models/document-type.model';
import { CreateDocumentTypeDto } from './dto/create-document-type.dto';
import { UpdateDocumentTypeDto } from './dto/update-document-type.dto';

@Injectable()
export class DocumentTypesService {
  constructor(
    @InjectModel(DocumentType)
    private readonly documentTypeModel: typeof DocumentType,
  ) {}

  async create(dto: CreateDocumentTypeDto): Promise<DocumentType> {
    try {
      return await this.documentTypeModel.create({ ...dto } as any);
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
    targetType?: string;
    isActive?: boolean;
  }): Promise<DocumentType[]> {
    const where: Record<string, unknown> = {};

    if (params.phaseCode) where.phaseCode = params.phaseCode;
    if (params.targetType) where.targetType = params.targetType;
    if (params.isActive !== undefined) where.isActive = params.isActive;

    return this.documentTypeModel.findAll({
      where,
      order: [
        ['phaseCode', 'ASC'],
        ['sequence', 'ASC'],
      ],
    });
  }

  async findOne(id: string): Promise<DocumentType> {
    const documentType = await this.documentTypeModel.findByPk(id);

    if (!documentType) {
      throw new NotFoundException(`Document type ${id} not found`);
    }

    return documentType;
  }

  async update(
    id: string,
    dto: UpdateDocumentTypeDto,
  ): Promise<DocumentType> {
    const documentType = await this.findOne(id);

    try {
      return await documentType.update({ ...dto });
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
