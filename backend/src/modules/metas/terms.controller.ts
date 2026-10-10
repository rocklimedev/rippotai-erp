import { RequirePermission } from '@/common/decorator/require-permission.decorator';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { TermsService } from './terms.service';
import { CreateTermsTemplateDto } from './dto/create-terms-template.dto';
import {
  UpdateTermsTemplateDto,
  UpdateTermsTemplateContentDto,
} from './dto/update-terms-template.dto';
import { TermsScope } from '@/common/enums/terms.enums';

@Controller('terms-templates')
export class TermsController {
  constructor(private readonly termsService: TermsService) {}

  @RequirePermission('terms-templates:read')
  @Get()
  findAll(
    @Query('scope') scope?: TermsScope,
    @Query('include_inactive') includeInactive?: string,
  ) {
    return this.termsService.findAll(scope, includeInactive === 'true');
  }

  @RequirePermission('terms-templates:read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.termsService.findOne(id);
  }

  @RequirePermission('terms-templates:read')
  @Get(':id/versions')
  getVersions(@Param('id') id: string) {
    return this.termsService.getVersions(id);
  }

  @RequirePermission('terms-templates:create')
  @Post()
  create(@Body() dto: CreateTermsTemplateDto, @Req() req: any) {
    return this.termsService.create(dto, req.user?.id);
  }

  @RequirePermission('terms-templates:update')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTermsTemplateDto) {
    return this.termsService.update(id, dto);
  }

  @RequirePermission('terms-templates:update')
  @Patch(':id/content')
  updateContent(
    @Param('id') id: string,
    @Body() dto: UpdateTermsTemplateContentDto,
    @Req() req: any,
  ) {
    return this.termsService.updateContent(id, dto, req.user?.id);
  }

  @RequirePermission('terms-templates:delete')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.termsService.remove(id);
  }
}
