import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/common/guards/jwt-auth-guard';
import {
  ApplyShortlistPackageDto,
  CreateShortlistPackageDto,
} from './dto/shortlist-package.dto';
import { ShortlistPackageService } from './shortlist-package.service';

@Controller('shortlist-packages')
@UseGuards(JwtAuthGuard)
export class ShortlistPackageController {
  constructor(private readonly service: ShortlistPackageService) {}
  @Get() list() {
    return this.service.list();
  }
  @Post() create(@Body() dto: CreateShortlistPackageDto) {
    return this.service.create(dto);
  }
  @Post(':id/preview') preview(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApplyShortlistPackageDto,
  ) {
    return this.service.preview(id, dto.target_shortlist_id);
  }
  @Post(':id/apply') apply(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApplyShortlistPackageDto,
  ) {
    return this.service.apply(id, dto.target_shortlist_id);
  }
  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
