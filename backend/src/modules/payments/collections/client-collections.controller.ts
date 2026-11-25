import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '@/common/decorator/current-user.decorator';
import { RequirePermission } from '@/common/decorator/require-permission.decorator';
import { ClientCollectionsService } from './client-collections.service';
import { CreateClientCollectionDto } from './client-collection.dto';

/** Client collections — token amount + project payments received (Command Center › Commercial). */
@Controller('client-collections')
export class ClientCollectionsController {
  constructor(private readonly service: ClientCollectionsService) {}

  @RequirePermission('payment-schedules:read')
  @Get('summary')
  summary() {
    return this.service.summary();
  }

  @RequirePermission('payment-schedules:update')
  @Post()
  create(@Body() dto: CreateClientCollectionDto, @CurrentUser() user: any) {
    return this.service.create(dto, user?.id);
  }

  @RequirePermission('payment-schedules:update')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
