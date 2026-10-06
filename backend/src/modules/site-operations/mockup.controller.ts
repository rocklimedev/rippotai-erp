import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { MockupService } from './mockup.service';
import { ProposeMockupDto, ReviewMockupDto } from './dto/mockup.dto';
import { MockupStatus } from '../../common/enums/site-operations.enums';

@Controller('site-ops/mockups')
export class MockupController {
  constructor(private readonly mockupService: MockupService) {}

  @Post()
  propose(@Body() dto: ProposeMockupDto) {
    return this.mockupService.propose(dto);
  }

  /** GET /site-ops/mockups?projectId=<uuid>&status=APPROVED — all projects when projectId is omitted. */
  @Get()
  listAll(
    @Query('projectId') projectId?: string,
    @Query('status') status?: MockupStatus,
  ) {
    return this.mockupService.list({
      projectId: projectId || undefined,
      status: status || undefined,
    });
  }

  @Patch(':id/review')
  review(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ReviewMockupDto) {
    return this.mockupService.review(id, dto);
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.mockupService.getOrThrow(id);
  }

  /** GET /site-ops/mockups/projects/:projectId?status=APPROVED */
  @Get('projects/:projectId')
  list(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query('status') status?: MockupStatus,
  ) {
    return this.mockupService.listForProject(projectId, status);
  }
}
