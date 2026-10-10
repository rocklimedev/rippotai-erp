import { RequirePermission } from '@/common/decorator/require-permission.decorator';
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { DocumentRegisterService } from './document-register.service';
import { RecordDeliverableDto } from '../process-workflow/dto/tracking.dto';

@Controller('documents')
export class DocumentRegisterController {
  constructor(private readonly registerService: DocumentRegisterService) {}

  @RequirePermission('documents:deliver')
  @Post('deliverable-records')
  recordDeliverable(@Body() dto: RecordDeliverableDto) {
    return this.registerService.recordDeliverable(dto);
  }

  /** The live document register for a project. */
  @RequirePermission('documents:read')
  @Get(':projectId/document-register')
  getRegister(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.registerService.getDocumentRegister(projectId);
  }
}
