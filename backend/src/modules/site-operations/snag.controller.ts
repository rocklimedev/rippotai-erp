import { RequirePermission } from '@/common/decorator/require-permission.decorator';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { SnagService } from './snag.service';
import { CreateSnagDto, QuerySnagDto, UpdateSnagDto } from './dto/snag.dto';

// TODO: add your AuthGuard / PermissionsGuard
@Controller('architect/snags')
export class SnagController {
  constructor(private readonly service: SnagService) {}

  @RequirePermission('architect-snags:create')
  @Post()
  create(@Body() dto: CreateSnagDto, @Req() req: any) {
    return this.service.create(dto, req.user?.id);
  }

  @RequirePermission('architect-snags:read')
  @Get()
  findAll(@Query() q: QuerySnagDto) {
    return this.service.findAll(q);
  }

  @RequirePermission('architect-snags:read')
  @Get('summary/:projectId')
  summary(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.service.summary(projectId);
  }

  @RequirePermission('architect-snags:read')
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @RequirePermission('architect-snags:update')
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSnagDto,
    @Req() req: any,
  ) {
    return this.service.update(id, dto, req.user?.id);
  }

  @RequirePermission('architect-snags:delete')
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
