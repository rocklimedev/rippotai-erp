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

  @Get()
  findAll(@Query('scope') scope?: TermsScope) {
    return this.termsService.findAll(scope);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.termsService.findOne(id);
  }

  @Get(':id/versions')
  getVersions(@Param('id') id: string) {
    return this.termsService.getVersions(id);
  }

  @Post()
  create(@Body() dto: CreateTermsTemplateDto, @Req() req: any) {
    return this.termsService.create(dto, req.user?.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTermsTemplateDto) {
    return this.termsService.update(id, dto);
  }

  @Patch(':id/content')
  updateContent(
    @Param('id') id: string,
    @Body() dto: UpdateTermsTemplateContentDto,
    @Req() req: any,
  ) {
    return this.termsService.updateContent(id, dto, req.user?.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.termsService.remove(id);
  }
}
