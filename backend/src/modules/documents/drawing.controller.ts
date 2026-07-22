import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { DrawingsService } from './drawing.service';
import { UploadDrawingDto } from './dto/upload-drawing.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth-guard';
import { CurrentUser } from '@/common/decorator/current-user.decorator';
import { User } from '@/modules/users/models/user.model';

@UseGuards(JwtAuthGuard)
@Controller('drawings')
export class DrawingsController {
  constructor(private readonly drawingsService: DrawingsService) {}

  @Get()
  findAll() {
    return this.drawingsService.findAll();
  }

  // NEW: GET /drawings/:id — backs DrawingsView.jsx / useGetDrawingByIdQuery
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.drawingsService.findOne(id);
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 100 * 1024 * 1024 },
    }),
  )
  create(
    @Body() dto: UploadDrawingDto,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: User,
  ) {
    return this.drawingsService.create(dto, file, user);
  }
}
