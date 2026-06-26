import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { QuotationsService } from './quotations.service';
import {
  CreateQuotationDto,
  UpdateQuotationDto,
  ReviewQuotationDto,
} from './dto/quotation.dto';
import { QuotationStatus } from '../../common/enums';

@Controller('quotations')
export class QuotationsController {
  constructor(private readonly quotationsService: QuotationsService) {}

  @Post()
  create(@Body() dto: CreateQuotationDto) {
    return this.quotationsService.create(dto);
  }

  @Get()
  findAll(
    @Query('status') status?: QuotationStatus,
    @Query('project_id') project_id?: string,
    @Query('vendor_id') vendor_id?: string,
    @Query('includeDeleted') includeDeleted?: string,
  ) {
    return this.quotationsService.findAll({
      status,
      project_id,
      vendor_id,
      includeDeleted: includeDeleted === 'true',
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.quotationsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateQuotationDto) {
    return this.quotationsService.update(id, dto);
  }

  @Patch(':id/submit')
  submit(@Param('id') id: string, @Body('submitted_by') submitted_by?: string) {
    return this.quotationsService.submit(id, submitted_by);
  }

  @Patch(':id/approve')
  approve(@Param('id') id: string, @Body() dto: ReviewQuotationDto) {
    return this.quotationsService.approve(id, dto);
  }

  @Patch(':id/return')
  returnForEditing(@Param('id') id: string, @Body() dto: ReviewQuotationDto) {
    return this.quotationsService.returnForEditing(id, dto);
  }

  @Patch(':id/decline')
  decline(@Param('id') id: string, @Body() dto: ReviewQuotationDto) {
    return this.quotationsService.decline(id, dto);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string, @Body('updated_by') updated_by?: string) {
    return this.quotationsService.cancel(id, updated_by);
  }

  @Patch(':id/restore')
  restore(@Param('id') id: string) {
    return this.quotationsService.restore(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  softDelete(@Param('id') id: string, @Body('deleted_by') deleted_by?: string) {
    return this.quotationsService.softDelete(id, deleted_by);
  }

  @Delete(':id/permanent')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.quotationsService.remove(id);
  }
}
