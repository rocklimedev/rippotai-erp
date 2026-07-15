import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { RekiService } from './reki.service';
import { CreateSiteRekiDto } from './dto/create-site-reki.dto';

// Matches endpoint="/documents/forms/site-reki" from SiteRekiForm
// (also the base of the nav("/documents/site-reki/:id") redirect on success)
@Controller('documents/forms/site-reki')
export class RekiController {
  constructor(private readonly rekiService: RekiService) {}

  @Post()
  create(@Body() dto: CreateSiteRekiDto) {
    return this.rekiService.create(dto);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.rekiService.findOne(id);
  }
}
