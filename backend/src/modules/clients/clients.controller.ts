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
} from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto, UpdateClientDto } from './dto/client.dto';
// import { CurrentUser } from '@/common/decorators/current-user.decorator'; // uncomment if you have this

@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  // =========================
  // CREATE
  // =========================
  @Post()
  create(@Body() dto: CreateClientDto) {
    return this.clientsService.create(dto);
  }

  // =========================
  // GET ALL
  // =========================
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
  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateClientDto) {
    return this.clientsService.update(id, dto);
  }

  // =========================
  // RESTORE
  // =========================
  @Patch(':id/restore')
  restore(@Param('id', ParseUUIDPipe) id: string) {
    return this.clientsService.restore(id);
  }

  // =========================
  // DELETE (Soft Delete)
  // =========================
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.clientsService.remove(id);
  }
}
