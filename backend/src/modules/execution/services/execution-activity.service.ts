import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { v4 as uuidv4 } from 'uuid';

import { ExecutionActivity } from '../models/execution-activity.model';
import { ExecutionStage } from '../models/execution-stage.model';
import { User } from '../../users/models/user.model';

import { CreateExecutionActivityDto } from '../dto/create-activity.dto';
import { UpdateExecutionActivityDto } from '../dto/update-activity.dto';

@Injectable()
export class ExecutionActivityService {
  constructor(
    @InjectModel(ExecutionActivity)
    private readonly activityModel: typeof ExecutionActivity,
  ) {}

  /**
   * Create Activity
   */
  async create(
    dto: CreateExecutionActivityDto,
    userId?: string,
  ): Promise<ExecutionActivity> {
    return await this.activityModel.create({
      id: uuidv4(),
      created_by: userId,
      ...dto,
    } as any);
  }

  /**
   * Get all activities for project
   */
  async findAll(projectId: string): Promise<ExecutionActivity[]> {
    return await this.activityModel.findAll({
      where: {
        project_id: projectId,
      },
      include: [
        {
          model: ExecutionStage,
          attributes: ['id', 'name', 'status'],
        },
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'name', 'email'],
        },
      ],
      order: [
        ['order', 'ASC'],
        ['activity_date', 'DESC'],
        ['created_at', 'DESC'],
      ],
    });
  }

  /**
   * Get activities by stage
   */
  async findByStage(stageId: string): Promise<ExecutionActivity[]> {
    return await this.activityModel.findAll({
      where: {
        stage_id: stageId,
      },
      include: [
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'name'],
        },
      ],
      order: [
        ['order', 'ASC'],
        ['created_at', 'ASC'],
      ],
    });
  }

  /**
   * Get activity by id
   */
  async findOne(id: string): Promise<ExecutionActivity> {
    const activity = await this.activityModel.findByPk(id, {
      include: [
        {
          model: ExecutionStage,
          attributes: ['id', 'name', 'status'],
        },
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    if (!activity) {
      throw new NotFoundException(`Execution activity with ID ${id} not found`);
    }

    return activity;
  }

  /**
   * Update activity
   */
  async update(
    id: string,
    dto: UpdateExecutionActivityDto,
    userId?: string,
  ): Promise<ExecutionActivity> {
    const activity = await this.findOne(id);

    await activity.update({
      ...dto,
      updated_by: userId,
    } as any);

    return await this.findOne(id);
  }

  /**
   * Delete activity
   */
  async remove(id: string, userId?: string): Promise<void> {
    const activity = await this.findOne(id);

    // Optional audit tracking
    // await activity.update({
    //   deleted_by: userId,
    // } as any);

    await activity.destroy();
  }

  /**
   * Reorder activities within a stage
   */
  async reorderActivities(
    stageId: string,
    activityIds: string[],
    userId?: string,
  ): Promise<void> {
    const updates = activityIds.map((id, index) =>
      this.activityModel.update(
        {
          order: index + 1,
          updated_by: userId,
        } as any,
        {
          where: {
            id,
            stage_id: stageId,
          },
        },
      ),
    );

    await Promise.all(updates);
  }

  /**
   * Count activities for project
   */
  async countByProject(projectId: string): Promise<number> {
    return await this.activityModel.count({
      where: {
        project_id: projectId,
      },
    });
  }
}
