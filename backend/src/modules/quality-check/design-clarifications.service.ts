import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import {
  DesignClarification,
  DesignClarificationStatus,
} from './models/design-clarification.model';
import { CreateDesignClarificationDto } from './dto/create-design-clarification.dto';
import { UpdateDesignClarificationDto } from './dto/update-design-clarification.dto';
import { RespondDesignClarificationDto } from './dto/respond-design-clarification.dto';

@Injectable()
export class DesignClarificationsService {
  constructor(
    @InjectModel(DesignClarification)
    private readonly clarificationModel: typeof DesignClarification,
  ) {}

  async create(
    dto: CreateDesignClarificationDto,
  ): Promise<DesignClarification> {
    return this.clarificationModel.create({
      ...dto,
      status: DesignClarificationStatus.OPEN,
    } as any);
  }

  async findAll(
    projectId?: string,
    status?: DesignClarificationStatus,
  ): Promise<DesignClarification[]> {
    const where: Record<string, unknown> = {};
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;
    return this.clarificationModel.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });
  }

  async findOne(id: string): Promise<DesignClarification> {
    const clarification = await this.clarificationModel.findByPk(id);
    if (!clarification) {
      throw new NotFoundException(`Design clarification ${id} not found`);
    }
    return clarification;
  }

  async update(
    id: string,
    dto: UpdateDesignClarificationDto,
  ): Promise<DesignClarification> {
    const clarification = await this.findOne(id);
    return clarification.update({ ...dto });
  }

  async respond(
    id: string,
    dto: RespondDesignClarificationDto,
  ): Promise<DesignClarification> {
    const clarification = await this.findOne(id);
    return clarification.update({
      response: dto.response,
      respondedBy: dto.respondedBy,
      status: dto.status ?? DesignClarificationStatus.ANSWERED,
      respondedAt: new Date(),
    });
  }

  async remove(id: string): Promise<void> {
    const clarification = await this.findOne(id);
    await clarification.destroy();
  }
}
