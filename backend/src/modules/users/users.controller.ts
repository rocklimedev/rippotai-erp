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
import { User } from './models/user.model';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() dto: CreateUserDto): Promise<User> {
    return this.usersService.create(dto);
  }

  @Get()
  findAll(
    @Query('role_id') role_id?: string,
    @Query('is_active') is_active?: string,
  ): Promise<User[]> {
    return this.usersService.findAll({
      role_id,
      is_active: is_active === undefined ? undefined : is_active === 'true',
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<User> {
    return this.usersService.findOne(id);
  }

  // Self-service profile update - name / email / phone / job_title only.
  // Anything the logged-in user edits from their own "Profile Settings"
  // screen should hit this, not the admin-facing PATCH /:id below.
  @Patch(':id/profile')
  updateProfile(
    @Param('id') id: string,
    @Body() dto: UpdateProfileDto,
  ): Promise<User> {
    return this.usersService.updateProfile(id, dto);
  }

  // Avatar upload - multipart/form-data, field name "avatar".
  // Validation (mime type + 2MB limit) is enforced both here (fast fail,
  // avoids buffering an oversized file) and again in the service layer.
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
  ): Promise<User> {
    return this.usersService.uploadAvatar(id, file);
  }

  // Admin-facing update - can also change role_id / is_active / etc.
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto): Promise<User> {
    return this.usersService.update(id, dto);
  }

  @Patch(':id/deactivate')
  deactivate(@Param('id') id: string): Promise<User> {
    return this.usersService.deactivate(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.usersService.remove(id);
  }
}
