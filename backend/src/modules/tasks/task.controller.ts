import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
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
  // Get All Tasks
  // =========================
  @Get()
  findAll() {
    return this.tasksService.findAll();
  }

  // =========================
  // Get Task Board
  // =========================
  @Get('board')
  getBoard() {
    return this.tasksService.getBoard();
  }

  // =========================
  // Get My Tasks
  // =========================
  @Get('my-tasks')
  getMyTasks(@Req() req: AuthRequest) {
    return this.tasksService.getMyTasks(req.user.id);
  }

  // =========================
  // Get My Task Board
  // =========================
  @Get('my-board')
  getMyBoard(@Req() req: AuthRequest) {
    return this.tasksService.getMyBoard(req.user.id);
  }

  // =========================
  // Get Task By ID
  // =========================
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  // =========================
  // Create Task
  // =========================
  @Post()
  create(@Body() createTaskDto: CreateTaskDto, @Req() req: AuthRequest) {
    return this.tasksService.create(createTaskDto, req.user.id);
  }

  // =========================
  // Toggle Task Status
  // =========================
  @Patch(':id/toggle')
  toggleStatus(@Param('id') id: string) {
    return this.tasksService.toggleStatus(id);
  }

  // =========================
  // Update Task
  // =========================
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto) {
    return this.tasksService.update(id, updateTaskDto);
  }

  // =========================
  // Delete Task
  // =========================
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tasksService.remove(id);
  }
}
