import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '@/common/guards/jwt-auth-guard';

import { GoogleTasksService } from './google-tasks.service';

interface AuthenticatedRequest {
  user: {
    id?: string | number;
    userId?: string | number;
  };
}
export interface TaskInput {
  title: string;
  notes?: string;
  due?: string;
  status?: 'needsAction' | 'completed';

  // Google Tasks supports a parent task
  parent?: string;

  // Optional positioning
  previous?: string;
}
@Controller('google/tasks')
@UseGuards(JwtAuthGuard)
export class GoogleTasksController {
  constructor(private readonly googleTasks: GoogleTasksService) {}

  private getUserId(req: AuthenticatedRequest): string {
    const userId = req.user?.id ?? req.user?.userId;

    if (!userId) {
      throw new Error('Authenticated user ID not found');
    }

    return String(userId);
  }

  /**
   * GET /google/tasks/lists
   *
   * Returns task lists belonging to the
   * currently connected Google account.
   */
  @Get('lists')
  async listTaskLists(@Req() req: AuthenticatedRequest) {
    const userId = this.getUserId(req);

    return this.googleTasks.listTaskLists(userId);
  }

  /**
   * GET /google/tasks
   *
   * Defaults to the user's @default task list.
   */
  @Get()
  async listTasks(
    @Req() req: AuthenticatedRequest,

    @Query('taskListId')
    taskListId?: string,

    @Query('showCompleted')
    showCompleted?: string,

    @Query('showHidden')
    showHidden?: string,

    @Query('maxResults')
    maxResults?: string,

    @Query('pageToken')
    pageToken?: string,
  ) {
    const userId = this.getUserId(req);

    return this.googleTasks.listTasks(userId, taskListId ?? '@default', {
      showCompleted:
        showCompleted !== undefined ? showCompleted === 'true' : undefined,

      showHidden: showHidden !== undefined ? showHidden === 'true' : undefined,

      maxResults: maxResults ? Number(maxResults) : undefined,

      pageToken,
    });
  }

  /**
   * GET /google/tasks/lists/:taskListId/tasks
   */
  @Get('lists/:taskListId/tasks')
  async listTasksFromList(
    @Req() req: AuthenticatedRequest,
    @Param('taskListId') taskListId: string,

    @Query('showCompleted')
    showCompleted?: string,

    @Query('showHidden')
    showHidden?: string,

    @Query('maxResults')
    maxResults?: string,

    @Query('pageToken')
    pageToken?: string,
  ) {
    const userId = this.getUserId(req);

    return this.googleTasks.listTasks(userId, taskListId, {
      showCompleted:
        showCompleted !== undefined ? showCompleted === 'true' : undefined,

      showHidden: showHidden !== undefined ? showHidden === 'true' : undefined,

      maxResults: maxResults ? Number(maxResults) : undefined,

      pageToken,
    });
  }

  /**
   * POST /google/tasks
   *
   * Creates task in user's default task list.
   */
  @Post()
  async createTask(@Req() req: AuthenticatedRequest, @Body() task: TaskInput) {
    const userId = this.getUserId(req);

    return this.googleTasks.createTask(userId, task, '@default');
  }

  /**
   * POST /google/tasks/lists/:taskListId/tasks
   */
  @Post('lists/:taskListId/tasks')
  async createTaskInList(
    @Req() req: AuthenticatedRequest,
    @Param('taskListId') taskListId: string,
    @Body() task: TaskInput,
  ) {
    const userId = this.getUserId(req);

    return this.googleTasks.createTask(userId, task, taskListId);
  }

  /**
   * PATCH /google/tasks/:taskId
   */
  @Patch(':taskId')
  async updateTask(
    @Req() req: AuthenticatedRequest,
    @Param('taskId') taskId: string,
    @Body() task: Partial<TaskInput>,
    @Query('taskListId')
    taskListId?: string,
  ) {
    const userId = this.getUserId(req);

    return this.googleTasks.updateTask(
      userId,
      taskId,
      task,
      taskListId ?? '@default',
    );
  }

  /**
   * PATCH
   * /google/tasks/lists/:taskListId/tasks/:taskId
   */
  @Patch('lists/:taskListId/tasks/:taskId')
  async updateTaskInList(
    @Req() req: AuthenticatedRequest,
    @Param('taskListId') taskListId: string,
    @Param('taskId') taskId: string,
    @Body() task: Partial<TaskInput>,
  ) {
    const userId = this.getUserId(req);

    return this.googleTasks.updateTask(userId, taskId, task, taskListId);
  }

  /**
   * POST /google/tasks/:taskId/complete
   */
  @Post(':taskId/complete')
  async completeTask(
    @Req() req: AuthenticatedRequest,
    @Param('taskId') taskId: string,
    @Query('taskListId')
    taskListId?: string,
  ) {
    const userId = this.getUserId(req);

    return this.googleTasks.completeTask(
      userId,
      taskId,
      taskListId ?? '@default',
    );
  }

  /**
   * POST
   * /google/tasks/lists/:taskListId/tasks/:taskId/complete
   */
  @Post('lists/:taskListId/tasks/:taskId/complete')
  async completeTaskInList(
    @Req() req: AuthenticatedRequest,
    @Param('taskListId') taskListId: string,
    @Param('taskId') taskId: string,
  ) {
    const userId = this.getUserId(req);

    return this.googleTasks.completeTask(userId, taskId, taskListId);
  }

  /**
   * DELETE /google/tasks/:taskId
   */
  @Delete(':taskId')
  async deleteTask(
    @Req() req: AuthenticatedRequest,
    @Param('taskId') taskId: string,
    @Query('taskListId')
    taskListId?: string,
  ) {
    const userId = this.getUserId(req);

    await this.googleTasks.deleteTask(userId, taskId, taskListId ?? '@default');

    return {
      success: true,
      message: 'Google Task deleted',
    };
  }

  /**
   * DELETE
   * /google/tasks/lists/:taskListId/tasks/:taskId
   */
  @Delete('lists/:taskListId/tasks/:taskId')
  async deleteTaskFromList(
    @Req() req: AuthenticatedRequest,
    @Param('taskListId') taskListId: string,
    @Param('taskId') taskId: string,
  ) {
    const userId = this.getUserId(req);

    await this.googleTasks.deleteTask(userId, taskId, taskListId);

    return {
      success: true,
      message: 'Google Task deleted',
    };
  }
}
