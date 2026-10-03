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
  @Get('items')
  items(@Query('include_inactive') inc?: string) {
    return this.service.listItems(inc === 'true');
  }

  @Post('items')
  createItem(@Body() dto: CreateQualityItemDto) {
    return this.service.createItem(dto);
  }

  @Patch('items/:id')
  updateItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateQualityItemDto,
  ) {
    return this.service.updateItem(id, dto);
  }

  @Delete('items/:id')
  deactivateItem(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.deactivateItem(id);
  }

  // ----- per-project results -----
  @Get('checks')
  projectChecklist(@Query() q: QueryQualityCheckDto) {
    return this.service.projectChecklist(q);
  }

  @Put('checks')
  upsert(@Body() dto: UpsertQualityCheckDto, @Req() req: any) {
    return this.service.upsertCheck(dto, req.user?.id);
  }

  @Get('summary/:projectId')
  summary(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.service.summary(projectId);
  }
}
