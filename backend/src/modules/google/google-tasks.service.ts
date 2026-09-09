// google/services/google-tasks.service.ts

import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';

import { GoogleAuthService } from '../auth/google-auth.service';

const TASKS_API = 'https://tasks.googleapis.com/tasks/v1';

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

@Injectable()
export class GoogleTasksService {
  constructor(private readonly googleAuth: GoogleAuthService) {}

  /**
   * Get all task lists belonging to THIS user's
   * connected personal Google account.
   */
  async listTaskLists(userId: string) {
    const accessToken = await this.googleAuth.getValidAccessToken(userId);

    return this.request(accessToken, '/users/@me/lists');
  }

  /**
   * Get tasks from a specific task list.
   *
   * @defaultTaskList = @default
   */
  async listTasks(
    userId: string,
    taskListId = '@default',
    opts: {
      showCompleted?: boolean;
      showHidden?: boolean;
      maxResults?: number;
      pageToken?: string;
    } = {},
  ) {
    const accessToken = await this.googleAuth.getValidAccessToken(userId);

    const params = new URLSearchParams();

    if (opts.showCompleted !== undefined) {
      params.set('showCompleted', String(opts.showCompleted));
    }

    if (opts.showHidden !== undefined) {
      params.set('showHidden', String(opts.showHidden));
    }

    if (opts.maxResults) {
      params.set('maxResults', String(opts.maxResults));
    }

    if (opts.pageToken) {
      params.set('pageToken', opts.pageToken);
    }

    const query = params.toString();

    return this.request(
      accessToken,
      `/lists/${encodeURIComponent(taskListId)}/tasks${
        query ? `?${query}` : ''
      }`,
    );
  }

  /**
   * Create a task in THIS user's Google Tasks.
   */
  async createTask(userId: string, task: TaskInput, taskListId = '@default') {
    const accessToken = await this.googleAuth.getValidAccessToken(userId);

    return this.request(
      accessToken,
      `/lists/${encodeURIComponent(taskListId)}/tasks`,
      {
        method: 'POST',
        body: JSON.stringify(task),
      },
    );
  }

  /**
   * Update a task belonging to THIS user's
   * Google account.
   */
  async updateTask(
    userId: string,
    taskId: string,
    task: Partial<TaskInput>,
    taskListId = '@default',
  ) {
    const accessToken = await this.googleAuth.getValidAccessToken(userId);

    return this.request(
      accessToken,
      `/lists/${encodeURIComponent(taskListId)}/tasks/${encodeURIComponent(taskId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(task),
      },
    );
  }

  /**
   * Mark task completed.
   */
  async completeTask(userId: string, taskId: string, taskListId = '@default') {
    return this.updateTask(
      userId,
      taskId,
      {
        status: 'completed',
      },
      taskListId,
    );
  }

  /**
   * Delete task.
   */
  async deleteTask(userId: string, taskId: string, taskListId = '@default') {
    const accessToken = await this.googleAuth.getValidAccessToken(userId);

    await this.request(
      accessToken,
      `/lists/${encodeURIComponent(taskListId)}/tasks/${encodeURIComponent(taskId)}`,
      {
        method: 'DELETE',
      },
      true,
    );
  }

  private async request(
    accessToken: string,
    path: string,
    init: RequestInit = {},
    noContent = false,
  ) {
    const res = await fetch(`${TASKS_API}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...init.headers,
      },
    });

    if (!res.ok) {
      const errorText = await res.text();

      if (res.status === 401) {
        throw new UnauthorizedException(
          'Google Tasks authorization has expired or is invalid.',
        );
      }

      throw new InternalServerErrorException(
        `Google Tasks API error: ${errorText}`,
      );
    }

    if (noContent) {
      return undefined;
    }

    return res.json();
  }
}
