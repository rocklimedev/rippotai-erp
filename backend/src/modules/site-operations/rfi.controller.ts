import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
  ParseUUIDPipe,
} from '@nestjs/common';
import { RfiService } from './rfi.service';
import { RaiseRfiDto, RespondToRfiDto, RerouteRfiDto } from './dto/rfi.dto';
import { RfiStatus } from '../../common/enums/site-operations.enums';

@Controller('site-ops/rfis')
export class RfiController {
  constructor(private readonly rfiService: RfiService) {}

  @Post()
  raise(@Body() dto: RaiseRfiDto) {
    return this.rfiService.raise(dto);
  }

  /** GET /site-ops/rfis?projectId=<uuid>&status=OPEN — all projects when projectId is omitted. */
  @Get()
  listAll(
    @Query('projectId') projectId?: string,
    @Query('status') status?: RfiStatus,
  ) {
    return this.rfiService.list({ projectId: projectId || undefined, status: status || undefined });
  }

  @Patch(':id/reroute')
  reroute(@Param('id', ParseIntPipe) id: number, @Body() dto: RerouteRfiDto) {
    return this.rfiService.reroute(id, dto);
  }

  @Patch(':id/respond')
  respond(@Param('id', ParseIntPipe) id: number, @Body() dto: RespondToRfiDto) {
    return this.rfiService.respond(id, dto);
  }

  @Patch(':id/close')
  close(@Param('id', ParseIntPipe) id: number) {
    return this.rfiService.close(id);
  }

  @Get(':id')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.rfiService.getOrThrow(id);
  }

  /** GET /site-ops/rfis/projects/:projectId?status=OPEN */
  @Get('projects/:projectId')
  list(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query('status') status?: RfiStatus,
  ) {
    return this.rfiService.listForProject(projectId, status);
  }

  /** The Architect's (or any team's) open RFI queue. */
  @Get('teams/:teamId/open')
  listOpenForTeam(@Param('teamId', ParseIntPipe) teamId: number) {
    return this.rfiService.listOpenForTeam(teamId);
  }
}
