import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { QuotationVersionsService } from './quotation-versions.service';

@Controller('quotations')
export class QuotationVersionsController {
  constructor(private readonly versionsService: QuotationVersionsService) {}

  // List versions for a quotation
  @Get(':quotationId/versions')
  list(@Param('quotationId') quotationId: string) {
    return this.versionsService.listVersions(quotationId);
  }

  // Create a new version (snapshot) for a quotation
  // Body: { created_by?: string, remarks?: string }
  @Post(':quotationId/versions')
  create(
    @Param('quotationId') quotationId: string,
    @Body('created_by') created_by?: string,
    @Body('remarks') remarks?: string,
  ) {
    return this.versionsService.createVersion(
      quotationId,
      created_by ?? null,
      remarks ?? null,
    );
  }

  // Get a single version by its id
  @Get('versions/:id')
  get(@Param('id') id: string) {
    return this.versionsService.getVersion(id);
  }

  // Delete a version
  @Delete('versions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id') id: string) {
    return this.versionsService.deleteVersion(id);
  }

  // Restore a version into the quotation
  // Body: { restored_by?: string }
  @Post('versions/:id/restore')
  restore(@Param('id') id: string, @Body('restored_by') restored_by?: string) {
    return this.versionsService.restoreVersion(id, restored_by ?? null);
  }
}
