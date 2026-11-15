import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { RequirePermission } from '@/common/decorator/require-permission.decorator';
import { DocFlowService } from './doc-flow.service';
import { RecordContextService } from './record-context.service';

// Every staff role holds documents:read; the service additionally enforces
// the document type's own access part (any level to read the history, Full
// access or ADMIN/SUPERADMIN to review).
@Controller('document-reviews')
export class DocumentReviewsController {
  constructor(
    private readonly flow: DocFlowService,
    private readonly records: RecordContextService,
  ) {}

  @RequirePermission('documents:read')
  @Get()
  list(
    @Req() req: any,
    @Query('entity_type') type: string,
    @Query('entity_id') entityId: string,
  ) {
    return this.flow.listReviews(req.user, type, entityId);
  }

  @RequirePermission('documents:read')
  @Get('meta')
  meta(@Req() req: any, @Query('entity_type') type: string) {
    return this.flow.meta(req.user, type);
  }

  @RequirePermission('documents:read')
  @Get('rows')
  rows(@Req() req: any, @Query('entity_type') type: string) {
    return this.flow.rows(req.user, type);
  }

  // Status, project, linked records and uploaded file versions of one document.
  @RequirePermission('documents:read')
  @Get('context')
  context(
    @Req() req: any,
    @Query('entity_type') type: string,
    @Query('entity_id') entityId: string,
  ) {
    return this.records.context(req.user, type, entityId);
  }

  @RequirePermission('documents:read')
  @Get('capabilities')
  capabilities(@Req() req: any, @Query('entity_type') type: string) {
    return this.flow.capabilities(req.user, type);
  }

  @RequirePermission('documents:read')
  @Get('existing')
  existing(
    @Req() req: any,
    @Query('entity_type') type: string,
    @Query('project_id') projectId: string,
  ) {
    return this.flow.existing(req.user, type, projectId);
  }

  @RequirePermission('documents:read')
  @Get('revisions/:id')
  revision(
    @Req() req: any,
    @Param('id') id: string,
    @Query('entity_type') type: string,
  ) {
    return this.flow.revision(req.user, type, id);
  }

  @RequirePermission('documents:read')
  @Post()
  review(@Req() req: any, @Body() body: any) {
    return this.flow.review(req.user, body ?? {});
  }
}

/** Project Overview "Recent activity": latest document, review, upload and project events. */
@Controller('projects')
export class ProjectRecentActivityController {
  constructor(private readonly records: RecordContextService) {}

  @RequirePermission('projects:read')
  @Get(':id/recent-activity')
  recentActivity(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) projectId: string,
    @Query('limit') limit?: string,
  ) {
    return this.records.recentActivity(req.user, projectId, Number(limit) || 8);
  }
}
