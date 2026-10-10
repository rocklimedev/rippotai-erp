import { RequirePermission } from '@/common/decorator/require-permission.decorator';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth-guard';
import { CurrentUser } from '../../../common/decorator/current-user.decorator';
import { VendorRateComparisonService } from '../services/vendor-rate-comparison.service';
import { SaveVendorRateComparisonDto } from '../dto/vendor-rate-comparison.dto';

@Controller('vendor-rate-comparisons')
@UseGuards(JwtAuthGuard)
export class VendorRateComparisonController {
  constructor(private readonly service: VendorRateComparisonService) {}
  @RequirePermission('vendor-rate-comparisons:read')
  @Get() list(
    @Query('project_id', new ParseUUIDPipe({ optional: true }))
    projectId?: string,
  ) {
    return this.service.list(projectId);
  }
  @RequirePermission('vendor-rate-comparisons:read')
  @Get(':id') get(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.get(id);
  }
  @RequirePermission('vendor-rate-comparisons:create')
  @Post() create(
    @Body() dto: SaveVendorRateComparisonDto,
    @CurrentUser() user: any,
  ) {
    return this.service.create(dto, user.id);
  }
  @RequirePermission('vendor-rate-comparisons:update')
  @Put(':id') update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SaveVendorRateComparisonDto,
  ) {
    return this.service.update(id, dto);
  }
}
