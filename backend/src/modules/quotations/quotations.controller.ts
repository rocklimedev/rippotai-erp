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
  UseGuards,
} from '@nestjs/common';
import { QuotationsService } from './quotations.service';
import {
  CreateQuotationDto,
  UpdateQuotationDto,
  ReviewQuotationDto,
} from './dto/quotation.dto';
import { QuotationStatus } from '../../common/enums';
import { JwtAuthGuard } from '@/common/guards/jwt-auth-guard';
import { CurrentUser } from '@/common/decorator/current-user.decorator';
@Controller('quotations')
@UseGuards(JwtAuthGuard)
export class QuotationsController {
  constructor(private readonly quotationsService: QuotationsService) {}

  @Post()
  create(@Body() dto: CreateQuotationDto, @CurrentUser() user: any) {
    return this.quotationsService.create(dto, user);
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
  update(
    @Param('id') id: string,
    @Body() dto: UpdateQuotationDto,
    @CurrentUser() user: any,
  ) {
    return this.quotationsService.update(id, dto, user);
  }

  @Patch(':id/submit')
  submit(
    @Param('id') id: string,
    @Body('submitted_by') submitted_by: string | undefined,
    @CurrentUser() user: any,
  ) {
    return this.quotationsService.submit(id, submitted_by, user);
  }

  @Patch(':id/approve')
  approve(
    @Param('id') id: string,
    @Body() dto: ReviewQuotationDto,
    @CurrentUser() user: any,
  ) {
    return this.quotationsService.approve(id, dto, user);
  }

  @Patch(':id/return')
  returnForEditing(
    @Param('id') id: string,
    @Body() dto: ReviewQuotationDto,
    @CurrentUser() user: any,
  ) {
    return this.quotationsService.returnForEditing(id, dto, user);
  }

  @Patch(':id/decline')
  decline(
    @Param('id') id: string,
    @Body() dto: ReviewQuotationDto,
    @CurrentUser() user: any,
  ) {
    return this.quotationsService.decline(id, dto, user);
  }

  @Patch(':id/cancel')
  cancel(
    @Param('id') id: string,
    @Body('updated_by') updated_by: string | undefined,
    @CurrentUser() user: any,
  ) {
    return this.quotationsService.cancel(id, updated_by, user);
  }

  @Patch(':id/restore')
  restore(@Param('id') id: string, @CurrentUser() user: any) {
    return this.quotationsService.restore(id, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  softDelete(
    @Param('id') id: string,
    @Body('deleted_by') deleted_by: string | undefined,
    @CurrentUser() user: any,
  ) {
    return this.quotationsService.softDelete(id, deleted_by, user);
  }

  @Delete(':id/permanent')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.quotationsService.remove(id);
  }
}
