import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { RequirePermission } from '@/common/decorator/require-permission.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth-guard';
import { VendorTradeService } from '../services/vendor-trade.service';
import { CreateVendorTradeDto } from '../dto/vendor-trade.dto';

@Controller('vendor-trades')
@UseGuards(JwtAuthGuard)
export class VendorTradeController {
  constructor(private readonly service: VendorTradeService) {}
  @Get()
  @RequirePermission('vendor-rate-comparisons:read')
  list() {
    return this.service.list();
  }
  @Post()
  @RequirePermission('vendor-rate-comparisons:create')
  create(@Body() dto: CreateVendorTradeDto) {
    return this.service.create(dto);
  }
}
