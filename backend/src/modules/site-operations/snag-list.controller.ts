import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '@/common/guards/jwt-auth-guard';
import { CdnService } from '../cdn/cdn.service';
import { SnagListService } from './snag-list.service';
import {
  CreateSnagListDto,
  UpdateSnagListDto,
  QuerySnagListDto,
} from './dto/snag-list.dto';
@UseGuards(JwtAuthGuard)
@Controller('site-ops/snag-lists')
export class SnagListController {
  constructor(
    private readonly service: SnagListService,
    private readonly cdn: CdnService,
  ) {}
  @Post() create(@Body() dto: CreateSnagListDto, @Req() req: any) {
    return this.service.create(dto, req.user?.id);
  }
  @Get() list(@Query() query: QuerySnagListDto) {
    return this.service.list(query);
  }
  @Post('photos')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 15 * 1024 * 1024 },
    }),
  )
  async uploadPhoto(@UploadedFile() file: Express.Multer.File) {
    if (!file?.size || !/^image\//.test(file.mimetype))
      throw new BadRequestException('An image file is required');
    return this.cdn.uploadFile(file);
  }
  @Get(':id/export') async download(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ) {
    const row = await this.service.download(id);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="snag-list-${row.id}-r${row.revision}.xlsx"`,
    );
    res.send(row.excel_data);
  }
  @Get(':id') findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }
  @Patch(':id') update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSnagListDto,
    @Req() req: any,
  ) {
    return this.service.update(id, dto, req.user?.id);
  }
}
