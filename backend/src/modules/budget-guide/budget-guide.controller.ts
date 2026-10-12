import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { RequirePermission } from '../../common/decorator/require-permission.decorator';
import { BudgetGuideService } from './budget-guide.service';
import {
  CreateBudgetGuideDto,
  DeleteBudgetGuideDto,
  ListBudgetGuidesDto,
  TransferBudgetGuideDto,
  UpdateBudgetGuideDto,
} from './dto/budget-guide.dto';

@Controller('budget-guides')
export class BudgetGuideController {
  constructor(private readonly service: BudgetGuideService) {}
  @RequirePermission('budget-guides:read')
  @Get('template')
  template(@Query('reference') reference?: string) {
    return this.service.template(reference === 'construction');
  }
  @RequirePermission('budget-guides:read')
  @Get()
  list(@Query() query: ListBudgetGuidesDto) {
    return this.service.list(query);
  }
  @RequirePermission('budget-guides:create')
  @Post()
  create(@Body() dto: CreateBudgetGuideDto, @Req() req: any) {
    return this.service.create(dto, req.user);
  }
  @RequirePermission('budget-guides:read')
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }
  @RequirePermission('budget-guides:update')
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBudgetGuideDto,
    @Req() req: any,
  ) {
    return this.service.update(id, dto, req.user);
  }
  @RequirePermission('budget-guides:create')
  @Post(':id/transfer')
  transfer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TransferBudgetGuideDto,
    @Req() req: any,
  ) {
    if (!req.user.permissions?.includes('budget-guides:read'))
      throw new ForbiddenException('Transfer requires budget-guides:read.');
    return this.service.transfer(id, dto, req.user);
  }
  @RequirePermission('budget-guides:delete')
  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: DeleteBudgetGuideDto,
  ) {
    return this.service.remove(id, query.expected_revision);
  }
}
