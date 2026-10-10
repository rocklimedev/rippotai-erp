import { RequirePermission } from '@/common/decorator/require-permission.decorator';
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  ParseBoolPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto, UpdateClientDto } from './dto/client.dto';

import { JwtAuthGuard } from '@/common/guards/jwt-auth-guard';
import { CurrentUser } from '@/common/decorator/current-user.decorator';
import { User } from '@/modules/users/models/user.model';

@Controller('clients')
@UseGuards(JwtAuthGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  // =========================
  // CREATE
  // =========================
  @RequirePermission('clients:create')
  @Post()
  create(@Body() dto: CreateClientDto, @CurrentUser() user: User) {
    return this.clientsService.create(dto, user);
  }

  // =========================
  // GET ALL
  // =========================
  @RequirePermission('clients:read')
  @Get()
  findAll(
    @Query('includeDeleted', new ParseBoolPipe({ optional: true }))
    includeDeleted?: boolean,
  ) {
    return this.clientsService.findAll({ includeDeleted: !!includeDeleted });
  }

  // =========================
  // GET ONE
  // =========================
  @RequirePermission('clients:read')
  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('includeDeleted', new ParseBoolPipe({ optional: true }))
    includeDeleted?: boolean,
  ) {
    return this.clientsService.findOne(id, !!includeDeleted);
  }

  // =========================
  // UPDATE
  // =========================
  @RequirePermission('clients:update')
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateClientDto,
    @CurrentUser() user: User,
  ) {
    return this.clientsService.update(id, dto, user);
  }

  // =========================
  // RESTORE
  // =========================
  @RequirePermission('clients:restore')
  @Patch(':id/restore')
  restore(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.clientsService.restore(id, user);
  }

  // =========================
  // DELETE (Soft Delete)
  // =========================
  @RequirePermission('clients:delete')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.clientsService.remove(id, user);
  }
}
