import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, UpdateProfileDto } from './dto/user.dto';

import { CurrentUser } from '@/common/decorator/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // =========================
  // CREATE USER (Admin)
  // =========================
  @Post()
  create(@Body() dto: CreateUserDto, @CurrentUser() actor?: any) {
    return this.usersService.create(dto, actor);
  }

  // =========================
  // GET ALL USERS
  // =========================
  @Get()
  findAll(
    @Query('role_id') role_id?: string,
    @Query('is_active') is_active?: string,
  ) {
    return this.usersService.findAll({
      role_id,
      is_active: is_active === undefined ? undefined : is_active === 'true',
    });
  }

  // =========================
  // GET ONE USER
  // =========================
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  // =========================
  // UPDATE PROFILE (Self)
  // =========================
  @Patch(':id/profile')
  updateProfile(
    @Param('id') id: string,
    @Body() dto: UpdateProfileDto,
    @CurrentUser() actor: any,
  ) {
    return this.usersService.updateProfile(id, dto, actor.id);
  }

  // =========================
  // UPLOAD AVATAR
  // =========================
  @Patch(':id/avatar')
  @UseInterceptors(
    FileInterceptor('avatar', {
      limits: { fileSize: 2 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          cb(new BadRequestException('Only image files are allowed'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  uploadAvatar(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() actor: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.usersService.uploadAvatar(id, file, actor.id);
  }

  // =========================
  // UPDATE USER (Admin)
  // =========================
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() actor?: any,
  ) {
    return this.usersService.update(id, dto, actor);
  }

  // =========================
  // DEACTIVATE USER
  // =========================
  @Patch(':id/deactivate')
  deactivate(@Param('id') id: string, @CurrentUser() actor?: any) {
    return this.usersService.deactivate(id, actor);
  }

  // =========================
  // DELETE USER
  // =========================
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() actor?: any) {
    return this.usersService.remove(id, actor);
  }
}
