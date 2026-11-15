import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { DocumentApprovalsController } from './approvals.controller';
import { ApprovalsService } from './approvals.service';
import {
  DocumentReviewsController,
  ProjectRecentActivityController,
} from './doc-flow.controller';
import { RecordContextService } from './record-context.service';
import { DocFlowService } from './doc-flow.service';
import { DocumentSnapshotInterceptor } from './snapshot.interceptor';

@Module({
  controllers: [
    DocumentApprovalsController,
    DocumentReviewsController,
    ProjectRecentActivityController,
  ],
  providers: [
    DocFlowService,
    ApprovalsService,
    RecordContextService,
    DocumentSnapshotInterceptor,
    { provide: APP_INTERCEPTOR, useExisting: DocumentSnapshotInterceptor },
  ],
  exports: [DocFlowService],
})
export class DocFlowModule {}
