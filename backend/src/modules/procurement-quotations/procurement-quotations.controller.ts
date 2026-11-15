import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RequirePermission } from '@/common/decorator/require-permission.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth-guard';
import { CurrentUser } from '../../common/decorator/current-user.decorator';
import { ProcurementQuotationsService } from './procurement-quotations.service';
import {
  CreateProcurementQuotationDto,
  QuotationFromComparisonDto,
  QuotationStatusDto,
  SaveProcurementQuotationDto,
} from './dto/procurement-quotation.dto';

/** Build › Procurement › Quotation (vendor comparison → quotation → PO / WO). */
@Controller('procurement-quotations')
@UseGuards(JwtAuthGuard)
export class ProcurementQuotationsController {
  constructor(private readonly service: ProcurementQuotationsService) {}

  @RequirePermission('procurement-quotations:read')
  @Get()
  list(
    @Query('project_id', new ParseUUIDPipe({ optional: true }))
    projectId?: string,
    @Query('vendor_id', new ParseUUIDPipe({ optional: true }))
    vendorId?: string,
    @Query('status') status?: string,
  ) {
    return this.service.list({ projectId, vendorId, status });
  }

  @RequirePermission('procurement-quotations:read')
  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.get(id);
  }

  @RequirePermission('procurement-quotations:read')
  @Get(':id/versions/:version')
  version(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('version', ParseIntPipe) version: number,
  ) {
    return this.service.getVersion(id, version);
  }

  @RequirePermission('procurement-quotations:create')
  @Post()
  create(@Body() dto: CreateProcurementQuotationDto, @CurrentUser() user: any) {
    return this.service.create(dto, user.id);
  }

  @RequirePermission('procurement-quotations:create')
  @Post('from-comparison')
  fromComparison(
    @Body() dto: QuotationFromComparisonDto,
    @CurrentUser() user: any,
  ) {
    return this.service.fromComparison(dto, user.id);
  }

  @RequirePermission('procurement-quotations:update')
  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SaveProcurementQuotationDto,
    @CurrentUser() user: any,
  ) {
    return this.service.update(id, dto, user.id);
  }

  @RequirePermission('procurement-quotations:update')
  @Patch(':id/status')
  status(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: QuotationStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.service.setStatus(id, dto.status, user.id);
  }

  @RequirePermission('purchase-orders:create')
  @Post(':id/raise-po')
  raisePo(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.service.raisePurchaseOrder(id, user.id);
  }

  @RequirePermission('work-orders:create')
  @Post(':id/raise-wo')
  raiseWo(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.service.raiseWorkOrder(id, user.id);
  }

  @RequirePermission('procurement-quotations:delete')
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
