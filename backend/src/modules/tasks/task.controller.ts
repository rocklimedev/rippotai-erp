import { RequirePermission } from '@/common/decorator/require-permission.decorator';
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  Query,
  UseGuards,
  Res,
  ParseUUIDPipe,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { CrucialWorkService } from './crucial-work.service';
import { CrucialWorkExportService } from './crucial-work-export.service';
import { CrucialWorkQueryDto, CrucialWorkExportDto, SaveCrucialCheckDto } from './dto/crucial-work.dto';

import { TasksService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

import { JwtAuthGuard } from '@/common/guards/jwt-auth-guard';

interface AuthRequest extends Request {
  user: {
    id: string;
    email: string;
    role?: string;
  };
}

@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService,
    private readonly crucialWork: CrucialWorkService,
    private readonly crucialExport: CrucialWorkExportService) {}

  @RequirePermission('tasks:read')
  @Get('crucial-work')
  getCrucialWork(@Query() query: CrucialWorkQueryDto) {
    return this.crucialWork.register(query);
  }

  @RequirePermission('tasks:read')
  @Get('crucial-work/template')
  async crucialTemplate(@Res() res: Response) {
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', 'attachment; filename="crucial-work-template.docx"');
    res.send(await this.crucialExport.template());
  }

  @RequirePermission('tasks:read')
  @Get('crucial-work/export')
  async exportCrucialWork(@Query() query: CrucialWorkExportDto, @Res() res: Response) {
    const register = await this.crucialWork.register(query);
    const buffer = query.format === 'docx'
      ? await this.crucialExport.word(register, query)
      : await this.crucialExport.pdf(register, query);
    res.setHeader('Content-Type', query.format === 'docx'
      ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="crucial-work-${query.cycle_date}.${query.format}"`);
    res.send(buffer);
  }

  @RequirePermission('tasks:update')
  @Post(':id/crucial-check')
  saveCrucialCheck(@Param('id', ParseUUIDPipe) id: string, @Body() dto: SaveCrucialCheckDto, @Req() req: AuthRequest) {
    return this.crucialWork.saveCheck(id, dto, req.user.id);
  }

  // =========================
  // GET ALL TASKS
  // =========================
  @RequirePermission('tasks:read')
  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('project_id') project_id?: string,
    @Query('assigned_to') assigned_to?: string,
    @Query('priority') priority?: string,
    @Query('q') q?: string,
  ) {
    return this.tasksService.findAll({
      status,
      project_id,
      assigned_to,
      priority,
      q,
    });
  }

  // =========================
  // GLOBAL BOARD
  // =========================
  @RequirePermission('tasks:read')
  @Get('board')
  getBoard() {
    return this.tasksService.getBoard();
  }

  // =========================
  // MY TASKS
  // =========================
  @RequirePermission('tasks:read')
  @Get('my-tasks')
  getMyTasks(@Req() req: AuthRequest) {
    return this.tasksService.getMyTasks(req.user.id);
  }

  // =========================
  // MY BOARD
  // =========================
  @RequirePermission('tasks:read')
  @Get('my-board')
  getMyBoard(@Req() req: AuthRequest) {
    return this.tasksService.getMyBoard(req.user.id);
  }

  // =========================
  // GET ONE
  // =========================
  @RequirePermission('tasks:read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  // =========================
  // CREATE
  // =========================
  @RequirePermission('tasks:create')
  @Post()
  create(@Body() createTaskDto: CreateTaskDto, @Req() req: AuthRequest) {
    return this.tasksService.create(createTaskDto, req.user.id, req.user);
  }

  // =========================
  // UPDATE
  // =========================
  @RequirePermission('tasks:update')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @Req() req: AuthRequest,
  ) {
    return this.tasksService.update(id, updateTaskDto, req.user);
  }

  // =========================
  // TOGGLE STATUS
  // =========================
  @RequirePermission('tasks:update')
  @Patch(':id/toggle')
  toggleStatus(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.tasksService.toggleStatus(id, req.user);
  }

  // =========================
  // DELETE
  // =========================
  @RequirePermission('tasks:delete')
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.tasksService.remove(id, req.user);
  }
}
