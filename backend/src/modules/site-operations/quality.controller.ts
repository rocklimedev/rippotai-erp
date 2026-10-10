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
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { QualityService } from './quality.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth-guard';
import {
  CreateQualityItemDto,
  QueryQualityCheckDto,
  UpdateQualityItemDto,
  UpsertQualityCheckDto,
} from './dto/quality.dto';

@Controller('architect/quality')
@UseGuards(JwtAuthGuard)
export class QualityController {
  constructor(private readonly service: QualityService) {}

  // ----- master checklist items -----
  @RequirePermission('architect-quality:read')
  @Get('items')
  items(@Query('include_inactive') inc?: string) {
    return this.service.listItems(inc === 'true');
  }

  @RequirePermission('architect-quality:create')
  @Post('items')
  createItem(@Body() dto: CreateQualityItemDto) {
    return this.service.createItem(dto);
  }

  @RequirePermission('architect-quality:update')
  @Patch('items/:id')
  updateItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateQualityItemDto,
  ) {
    return this.service.updateItem(id, dto);
  }

  @RequirePermission('architect-quality:delete')
  @Delete('items/:id')
  deactivateItem(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.deactivateItem(id);
  }

  // ----- per-project results -----
  @RequirePermission('architect-quality:read')
  @Get('checks')
  projectChecklist(@Query() q: QueryQualityCheckDto) {
    return this.service.projectChecklist(q);
  }

  @RequirePermission('architect-quality:update')
  @Put('checks')
  upsert(@Body() dto: UpsertQualityCheckDto, @Req() req: any) {
    return this.service.upsertCheck(dto, req.user?.id);
  }

  @RequirePermission('architect-quality:read')
  @Get('summary/:projectId')
  summary(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.service.summary(projectId);
  }
}
