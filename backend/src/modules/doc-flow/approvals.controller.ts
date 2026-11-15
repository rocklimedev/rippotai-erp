import { Controller, Get, Req } from '@nestjs/common';
import { RequirePermission } from '@/common/decorator/require-permission.decorator';
import { ApprovalsService } from './approvals.service';

// My approvals: documents waiting for the current user's decision. Every
// staff role holds documents:read; the service only returns document types
// the user can review.
@Controller('document-reviews/pending')
export class DocumentApprovalsController {
  constructor(private readonly approvals: ApprovalsService) {}

  @RequirePermission('documents:read')
  @Get()
  pending(@Req() req: any) {
    return this.approvals.pending(req.user);
  }

  @RequirePermission('documents:read')
  @Get('count')
  count(@Req() req: any) {
    return this.approvals.count(req.user);
  }
}
