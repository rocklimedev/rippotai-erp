// google/services/google-tasks.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { GoogleAuthService } from '../auth/google-auth.service';
const TASKS_API = 'https://tasks.googleapis.com/tasks/v1';

export interface TaskInput {
  title: string;
  notes?: string;
  due?: string; // RFC 3339 timestamp, time portion ignored by Google
  status?: 'needsAction' | 'completed';
}

@Injectable()
export class GoogleTasksService {
  constructor(private readonly googleAuth: GoogleAuthService) {}

  async listTaskLists(userId: string) {
    const accessToken = await this.googleAuth.getValidAccessToken(userId);
    return this.request(accessToken, `/users/@me/lists`);
  }

  async listTasks(userId: string, taskListId = '@default') {
    const accessToken = await this.googleAuth.getValidAccessToken(userId);
    return this.request(
      accessToken,
      `/lists/${encodeURIComponent(taskListId)}/tasks`,
    );
  }

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

  async updateTask(
    userId: string,
    taskId: string,
    task: Partial<TaskInput>,
    taskListId = '@default',
  ) {
    const accessToken = await this.googleAuth.getValidAccessToken(userId);
    return this.request(
      accessToken,
      `/lists/${encodeURIComponent(taskListId)}/tasks/${taskId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(task),
      },
    );
  }

  async completeTask(userId: string, taskId: string, taskListId = '@default') {
    return this.updateTask(userId, taskId, { status: 'completed' }, taskListId);
  }

  async deleteTask(userId: string, taskId: string, taskListId = '@default') {
    const accessToken = await this.googleAuth.getValidAccessToken(userId);
    await this.request(
      accessToken,
      `/lists/${encodeURIComponent(taskListId)}/tasks/${taskId}`,
      { method: 'DELETE' },
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
      throw new InternalServerErrorException(
        `Google Tasks API error: ${await res.text()}`,
      );
    }
    return noContent ? undefined : res.json();
  }
}
