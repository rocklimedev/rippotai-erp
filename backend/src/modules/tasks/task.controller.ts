import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

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
  constructor(private readonly tasksService: TasksService) {}

  // =========================
  // GET ALL TASKS
  // =========================
  @Get()
  findAll() {
    return this.tasksService.findAll();
  }

  // =========================
  // GLOBAL BOARD
  // =========================
  @Get('board')
  getBoard() {
    return this.tasksService.getBoard();
  }

  // =========================
  // MY TASKS
  // =========================
  @Get('my-tasks')
  getMyTasks(@Req() req: AuthRequest) {
    return this.tasksService.getMyTasks(req.user.id);
  }

  // =========================
  // MY BOARD
  // =========================
  @Get('my-board')
  getMyBoard(@Req() req: AuthRequest) {
    return this.tasksService.getMyBoard(req.user.id);
  }

  // =========================
  // GET ONE
  // =========================
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  // =========================
  // CREATE
  // =========================
  @Post()
  create(@Body() createTaskDto: CreateTaskDto, @Req() req: AuthRequest) {
    return this.tasksService.create(createTaskDto, req.user.id, req.user);
  }

  // =========================
  // UPDATE
  // =========================
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
  @Patch(':id/toggle')
  toggleStatus(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.tasksService.toggleStatus(id, req.user);
  }

  // =========================
  // DELETE
  // =========================
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.tasksService.remove(id, req.user);
  }
}
