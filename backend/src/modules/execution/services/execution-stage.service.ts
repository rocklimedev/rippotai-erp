import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { v4 as uuidv4 } from 'uuid';

import { ExecutionActivity } from '../models/execution-activity.model';
import { ExecutionStage } from '../models/execution-stage.model';

import { CreateExecutionStageDto } from '@/modules/projects/dto/create-stage.dto';
import { UpdateExecutionStageDto } from '@/modules/projects/dto/update-stage.dto';

@Injectable()
export class ExecutionStageService {
  constructor(
    @InjectModel(ExecutionStage)
    private readonly stageModel: typeof ExecutionStage,
  ) {}

  /**
   * Create Stage
   */
  async create(
    dto: CreateExecutionStageDto,
    userId?: string,
  ): Promise<ExecutionStage> {
    return await this.stageModel.create({
      id: uuidv4(),
      created_by: userId,
      ...dto,
    } as any);
  }

  /**
   * Get all stages for project
   */
  async findAll(projectId: string): Promise<ExecutionStage[]> {
    return await this.stageModel.findAll({
      where: {
        project_id: projectId,
      },
      order: [
        ['order', 'ASC'],
        ['created_at', 'ASC'],
      ],
      include: [
        {
          model: ExecutionActivity,
          as: 'activities',
          attributes: [
            'id',
            'title',
            'status',
            'progress_percentage',
            'created_by',
          ],
        },
      ],
    });
  }

  /**
   * Get stage by id
   */
  async findOne(id: string): Promise<ExecutionStage> {
    const stage = await this.stageModel.findByPk(id, {
      include: [
        {
          model: ExecutionActivity,
          as: 'activities',
          attributes: [
            'id',
            'title',
            'status',
            'progress_percentage',
            'created_by',
          ],
        },
      ],
    });

    if (!stage) {
      throw new NotFoundException(`Execution stage with ID ${id} not found`);
    }

    return stage;
  }

  /**
   * Update stage
   */
  async update(
    id: string,
    dto: UpdateExecutionStageDto,
    userId?: string,
  ): Promise<ExecutionStage> {
    const stage = await this.findOne(id);

    await stage.update({
      ...dto,
      updated_by: userId,
    } as any);

    return await this.findOne(id);
  }

  /**
   * Delete stage
   */
  async remove(id: string, userId?: string): Promise<void> {
    const stage = await this.findOne(id);

    // Optional audit tracking
    // await stage.update({
    //   deleted_by: userId,
    // } as any);

    await stage.destroy();
  }

  /**
   * Reorder stages
   */
  async reorderStages(
    projectId: string,
    stageIds: string[],
    userId?: string,
  ): Promise<void> {
    const updates = stageIds.map((id, index) =>
      this.stageModel.update(
        {
          order: index + 1,
          updated_by: userId,
        } as any,
        {
          where: {
            id,
            project_id: projectId,
          },
        },
      ),
    );

    await Promise.all(updates);
  }

  /**
   * Count stages by project
   */
  async countByProject(projectId: string): Promise<number> {
    return await this.stageModel.count({
      where: {
        project_id: projectId,
      },
    });
  }
}
