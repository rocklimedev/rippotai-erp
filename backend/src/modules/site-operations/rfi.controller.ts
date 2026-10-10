import { RequirePermission } from '@/common/decorator/require-permission.decorator';
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

  @RequirePermission('site-ops-rfis:create')
  @Post()
  raise(@Body() dto: RaiseRfiDto) {
    return this.rfiService.raise(dto);
  }

  /** GET /site-ops/rfis?projectId=<uuid>&status=OPEN — all projects when projectId is omitted. */
  @RequirePermission('site-ops-rfis:read')
  @Get()
  listAll(
    @Query('projectId') projectId?: string,
    @Query('status') status?: RfiStatus,
  ) {
    return this.rfiService.list({ projectId: projectId || undefined, status: status || undefined });
  }

  @RequirePermission('site-ops-rfis:update')
  @Patch(':id/reroute')
  reroute(@Param('id', ParseIntPipe) id: number, @Body() dto: RerouteRfiDto) {
    return this.rfiService.reroute(id, dto);
  }

  @RequirePermission('site-ops-rfis:update')
  @Patch(':id/respond')
  respond(@Param('id', ParseIntPipe) id: number, @Body() dto: RespondToRfiDto) {
    return this.rfiService.respond(id, dto);
  }

  @RequirePermission('site-ops-rfis:update')
  @Patch(':id/close')
  close(@Param('id', ParseIntPipe) id: number) {
    return this.rfiService.close(id);
  }

  @RequirePermission('site-ops-rfis:read')
  @Get(':id')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.rfiService.getOrThrow(id);
  }

  /** GET /site-ops/rfis/projects/:projectId?status=OPEN */
  @RequirePermission('site-ops-rfis:read')
  @Get('projects/:projectId')
  list(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query('status') status?: RfiStatus,
  ) {
    return this.rfiService.listForProject(projectId, status);
  }

  /** The Architect's (or any team's) open RFI queue. */
  @RequirePermission('site-ops-rfis:read')
  @Get('teams/:teamId/open')
  listOpenForTeam(@Param('teamId', ParseIntPipe) teamId: number) {
    return this.rfiService.listOpenForTeam(teamId);
  }
}
