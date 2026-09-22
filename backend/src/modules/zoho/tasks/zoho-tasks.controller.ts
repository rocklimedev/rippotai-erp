import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { ZohoTasksService } from './zoho-tasks.service';

import { CreateZohoTaskDto } from './dto/create-task.dto';
import { UpdateZohoTaskDto } from './dto/update-task.dto';
import { ListZohoTasksDto } from './dto/list-tasks.dto';

@Controller('zoho/projects')
export class ZohoTasksController {
  constructor(private readonly zohoTasksService: ZohoTasksService) {}

  /**
   * ---------------------------------------------------------
   * PORTALS
   * ---------------------------------------------------------
   */

  /**
   * GET /api/v1/zoho/projects/:ownerKey/portals
   */
  @Get(':ownerKey/portals')
  listPortals(@Param('ownerKey') ownerKey: string) {
    return this.zohoTasksService.listPortals(ownerKey);
  }

  /**
   * ---------------------------------------------------------
   * PROJECTS
   * ---------------------------------------------------------
   */

  /**
   * GET /api/v1/zoho/projects/:ownerKey/portals/:portalId/projects
   */
  @Get(':ownerKey/portals/:portalId/projects')
  listProjects(
    @Param('ownerKey') ownerKey: string,
    @Param('portalId') portalId: string,
    @Query() query: Record<string, any>,
  ) {
    return this.zohoTasksService.listProjects(ownerKey, portalId, query);
  }

  /**
   * POST /api/v1/zoho/projects/:ownerKey/portals/:portalId/projects
   */
  @Post(':ownerKey/portals/:portalId/projects')
  createProject(
    @Param('ownerKey') ownerKey: string,
    @Param('portalId') portalId: string,
    @Body() body: Record<string, any>,
  ) {
    return this.zohoTasksService.createProject(ownerKey, portalId, body);
  }

  /**
   * GET /api/v1/zoho/projects/:ownerKey/portals/:portalId/projects/:projectId
   */
  @Get(':ownerKey/portals/:portalId/projects/:projectId')
  getProject(
    @Param('ownerKey') ownerKey: string,
    @Param('portalId') portalId: string,
    @Param('projectId') projectId: string,
  ) {
    return this.zohoTasksService.getProject(ownerKey, portalId, projectId);
  }

  /**
   * PATCH /api/v1/zoho/projects/:ownerKey/portals/:portalId/projects/:projectId
   * (was PUT — V3's Zoho-side project update is partial, PATCH is the accurate verb here)
   */
  @Patch(':ownerKey/portals/:portalId/projects/:projectId')
  updateProject(
    @Param('ownerKey') ownerKey: string,
    @Param('portalId') portalId: string,
    @Param('projectId') projectId: string,
    @Body() body: Record<string, any>,
  ) {
    return this.zohoTasksService.updateProject(
      ownerKey,
      portalId,
      projectId,
      body,
    );
  }

  /**
   * DELETE /api/v1/zoho/projects/:ownerKey/portals/:portalId/projects/:projectId
   */
  @Delete(':ownerKey/portals/:portalId/projects/:projectId')
  deleteProject(
    @Param('ownerKey') ownerKey: string,
    @Param('portalId') portalId: string,
    @Param('projectId') projectId: string,
  ) {
    return this.zohoTasksService.deleteProject(ownerKey, portalId, projectId);
  }

  /**
   * ---------------------------------------------------------
   * TASKLISTS
   * ---------------------------------------------------------
   */

  /**
   * GET /api/v1/zoho/projects/:ownerKey/portals/:portalId/projects/:projectId/tasklists
   */
  @Get(':ownerKey/portals/:portalId/projects/:projectId/tasklists')
  listTasklists(
    @Param('ownerKey') ownerKey: string,
    @Param('portalId') portalId: string,
    @Param('projectId') projectId: string,
    @Query() query: Record<string, any>,
  ) {
    return this.zohoTasksService.listTasklists(
      ownerKey,
      portalId,
      projectId,
      query,
    );
  }

  /**
   * POST /api/v1/zoho/projects/:ownerKey/portals/:portalId/projects/:projectId/tasklists
   */
  @Post(':ownerKey/portals/:portalId/projects/:projectId/tasklists')
  createTasklist(
    @Param('ownerKey') ownerKey: string,
    @Param('portalId') portalId: string,
    @Param('projectId') projectId: string,
    @Body() body: Record<string, any>,
  ) {
    return this.zohoTasksService.createTasklist(
      ownerKey,
      portalId,
      projectId,
      body,
    );
  }

  /**
   * PATCH /api/v1/zoho/projects/:ownerKey/portals/:portalId/projects/:projectId/tasklists/:tasklistId
   * (was PUT — same PATCH rationale as updateProject)
   */
  @Patch(
    ':ownerKey/portals/:portalId/projects/:projectId/tasklists/:tasklistId',
  )
  updateTasklist(
    @Param('ownerKey') ownerKey: string,
    @Param('portalId') portalId: string,
    @Param('projectId') projectId: string,
    @Param('tasklistId') tasklistId: string,
    @Body() body: Record<string, any>,
  ) {
    return this.zohoTasksService.updateTasklist(
      ownerKey,
      portalId,
      projectId,
      tasklistId,
      body,
    );
  }

  /**
   * DELETE /api/v1/zoho/projects/:ownerKey/portals/:portalId/projects/:projectId/tasklists/:tasklistId
   */
  @Delete(
    ':ownerKey/portals/:portalId/projects/:projectId/tasklists/:tasklistId',
  )
  deleteTasklist(
    @Param('ownerKey') ownerKey: string,
    @Param('portalId') portalId: string,
    @Param('projectId') projectId: string,
    @Param('tasklistId') tasklistId: string,
  ) {
    return this.zohoTasksService.deleteTasklist(
      ownerKey,
      portalId,
      projectId,
      tasklistId,
    );
  }

  /**
   * GET /api/v1/zoho/projects/:ownerKey/portals/:portalId/projects/:projectId/tasklists/:tasklistId/tasks
   */
  @Get(
    ':ownerKey/portals/:portalId/projects/:projectId/tasklists/:tasklistId/tasks',
  )
  listTasklistTasks(
    @Param('ownerKey') ownerKey: string,
    @Param('portalId') portalId: string,
    @Param('projectId') projectId: string,
    @Param('tasklistId') tasklistId: string,
    @Query() query: ListZohoTasksDto,
  ) {
    return this.zohoTasksService.listTasklistTasks(
      ownerKey,
      portalId,
      projectId,
      tasklistId,
      query,
    );
  }

  /**
   * ---------------------------------------------------------
   * TASKS
   * ---------------------------------------------------------
   */

  /**
   * GET /api/v1/zoho/projects/:ownerKey/portals/:portalId/projects/:projectId/tasks
   */
  @Get(':ownerKey/portals/:portalId/projects/:projectId/tasks')
  listTasks(
    @Param('ownerKey') ownerKey: string,
    @Param('portalId') portalId: string,
    @Param('projectId') projectId: string,
    @Query() query: ListZohoTasksDto,
  ) {
    return this.zohoTasksService.listTasks(
      ownerKey,
      portalId,
      projectId,
      query,
    );
  }

  /**
   * POST /api/v1/zoho/projects/:ownerKey/portals/:portalId/projects/:projectId/tasks
   */
  @Post(':ownerKey/portals/:portalId/projects/:projectId/tasks')
  createTask(
    @Param('ownerKey') ownerKey: string,
    @Param('portalId') portalId: string,
    @Param('projectId') projectId: string,
    @Body() dto: CreateZohoTaskDto,
  ) {
    return this.zohoTasksService.createTask(ownerKey, portalId, projectId, dto);
  }

  /**
   * GET /api/v1/zoho/projects/:ownerKey/portals/:portalId/projects/:projectId/tasks/:taskId
   */
  @Get(':ownerKey/portals/:portalId/projects/:projectId/tasks/:taskId')
  getTask(
    @Param('ownerKey') ownerKey: string,
    @Param('portalId') portalId: string,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
  ) {
    return this.zohoTasksService.getTask(ownerKey, portalId, projectId, taskId);
  }

  /**
   * PATCH /api/v1/zoho/projects/:ownerKey/portals/:portalId/projects/:projectId/tasks/:taskId
   * (was PUT — V3 docs show PATCH .../tasks/{task_id} for partial task updates,
   * e.g. updating just assignee/due_date/a custom field)
   */
  @Patch(':ownerKey/portals/:portalId/projects/:projectId/tasks/:taskId')
  updateTask(
    @Param('ownerKey') ownerKey: string,
    @Param('portalId') portalId: string,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Body() dto: UpdateZohoTaskDto,
  ) {
    return this.zohoTasksService.updateTask(
      ownerKey,
      portalId,
      projectId,
      taskId,
      dto,
    );
  }

  /**
   * DELETE /api/v1/zoho/projects/:ownerKey/portals/:portalId/projects/:projectId/tasks/:taskId
   */
  @Delete(':ownerKey/portals/:portalId/projects/:projectId/tasks/:taskId')
  deleteTask(
    @Param('ownerKey') ownerKey: string,
    @Param('portalId') portalId: string,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
  ) {
    return this.zohoTasksService.deleteTask(
      ownerKey,
      portalId,
      projectId,
      taskId,
    );
  }

  /**
   * POST /api/v1/zoho/projects/:ownerKey/portals/:portalId/projects/:projectId/tasks/:taskId/reorder
   * ⚠️ Not confirmed in V3 docs — V2 had a dedicated reorder endpoint;
   * verify whether V3 still exposes this or whether ordering is now done
   * via a field on the PATCH task payload before relying on this route.
   */
  @Post(':ownerKey/portals/:portalId/projects/:projectId/tasks/:taskId/reorder')
  reorderTask(
    @Param('ownerKey') ownerKey: string,
    @Param('portalId') portalId: string,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Body() body: Record<string, any>,
  ) {
    return this.zohoTasksService.reorderTask(
      ownerKey,
      portalId,
      projectId,
      taskId,
      body,
    );
  }

  /**
   * GET /api/v1/zoho/projects/:ownerKey/portals/:portalId/projects/:projectId/tasks/:taskId/activities
   * ⚠️ Not confirmed in V3 docs — check whether this maps to a V3
   * "activities" module endpoint or has been folded into taskstatushistory.
   */
  @Get(
    ':ownerKey/portals/:portalId/projects/:projectId/tasks/:taskId/activities',
  )
  getTaskActivities(
    @Param('ownerKey') ownerKey: string,
    @Param('portalId') portalId: string,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
  ) {
    return this.zohoTasksService.getTaskActivities(
      ownerKey,
      portalId,
      projectId,
      taskId,
    );
  }

  /**
   * POST /api/v1/zoho/projects/:ownerKey/portals/:portalId/projects/:projectId/tasks/:taskId/follow
   * ⚠️ Not confirmed in V3 docs — verify follow/unfollow still exists as a
   * dedicated action endpoint in V3.
   */
  @Post(':ownerKey/portals/:portalId/projects/:projectId/tasks/:taskId/follow')
  followTask(
    @Param('ownerKey') ownerKey: string,
    @Param('portalId') portalId: string,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
  ) {
    return this.zohoTasksService.followTask(
      ownerKey,
      portalId,
      projectId,
      taskId,
    );
  }

  /**
   * POST /api/v1/zoho/projects/:ownerKey/portals/:portalId/projects/:projectId/tasks/:taskId/unfollow
   * ⚠️ Same caveat as followTask above.
   */
  @Post(
    ':ownerKey/portals/:portalId/projects/:projectId/tasks/:taskId/unfollow',
  )
  unfollowTask(
    @Param('ownerKey') ownerKey: string,
    @Param('portalId') portalId: string,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
  ) {
    return this.zohoTasksService.unfollowTask(
      ownerKey,
      portalId,
      projectId,
      taskId,
    );
  }

  /**
   * ---------------------------------------------------------
   * SUBTASKS
   * ---------------------------------------------------------
   */

  /**
   * GET /api/v1/zoho/projects/:ownerKey/portals/:portalId/projects/:projectId/tasks/:taskId/subtasks
   */
  @Get(':ownerKey/portals/:portalId/projects/:projectId/tasks/:taskId/subtasks')
  listSubtasks(
    @Param('ownerKey') ownerKey: string,
    @Param('portalId') portalId: string,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
  ) {
    return this.zohoTasksService.listSubtasks(
      ownerKey,
      portalId,
      projectId,
      taskId,
    );
  }

  /**
   * POST /api/v1/zoho/projects/:ownerKey/portals/:portalId/projects/:projectId/tasks/:taskId/subtasks
   */
  @Post(
    ':ownerKey/portals/:portalId/projects/:projectId/tasks/:taskId/subtasks',
  )
  createSubtask(
    @Param('ownerKey') ownerKey: string,
    @Param('portalId') portalId: string,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Body() dto: CreateZohoTaskDto,
  ) {
    return this.zohoTasksService.createSubtask(
      ownerKey,
      portalId,
      projectId,
      taskId,
      dto,
    );
  }

  /**
   * ---------------------------------------------------------
   * LAYOUTS / VIEWS
   * ---------------------------------------------------------
   */

  /**
   * GET /api/v1/zoho/projects/:ownerKey/portals/:portalId/projects/:projectId/tasklayouts
   * ⚠️ Not confirmed in V3 docs — verify exact V3 layouts path before relying on this.
   */
  @Get(':ownerKey/portals/:portalId/projects/:projectId/tasklayouts')
  getTaskLayouts(
    @Param('ownerKey') ownerKey: string,
    @Param('portalId') portalId: string,
    @Param('projectId') projectId: string,
  ) {
    return this.zohoTasksService.getTaskLayouts(ownerKey, portalId, projectId);
  }

  /**
   * GET /api/v1/zoho/projects/:ownerKey/portals/:portalId/projects/:projectId/tasks-views
   * ⚠️ Not confirmed in V3 docs — verify against V3 "views" module.
   */
  @Get(':ownerKey/portals/:portalId/projects/:projectId/tasks-views')
  getTaskViews(
    @Param('ownerKey') ownerKey: string,
    @Param('portalId') portalId: string,
    @Param('projectId') projectId: string,
  ) {
    return this.zohoTasksService.getTaskViews(ownerKey, portalId, projectId);
  }

  /**
   * GET /api/v1/zoho/projects/:ownerKey/portals/:portalId/mytasks-views
   * ⚠️ Not confirmed in V3 docs — V3 does confirm GET /api/v3/portal/{portal_id}/mytasks
   * exists (no trailing slash), but "mytasks-views" specifically wasn't found;
   * verify this maps correctly on the service side.
   */
  @Get(':ownerKey/portals/:portalId/mytasks-views')
  getMyTasksViews(
    @Param('ownerKey') ownerKey: string,
    @Param('portalId') portalId: string,
  ) {
    return this.zohoTasksService.getMyTasksViews(ownerKey, portalId);
  }
}
