import { Controller, Get, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { DocumentRegisterService } from './document-register.service';
import { RecordDeliverableDto } from './dto/tracking.dto';

@Controller('workflow')
export class DocumentRegisterController {
  constructor(private readonly registerService: DocumentRegisterService) {}

  @Post('deliverable-records')
  recordDeliverable(@Body() dto: RecordDeliverableDto) {
    return this.registerService.recordDeliverable(dto);
  }

  /** The live document register for a project. */
  @Get('projects/:projectId/document-register')
  getRegister(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.registerService.getDocumentRegister(projectId);
  }
}
