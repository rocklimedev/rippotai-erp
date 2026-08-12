import { PartialType } from '@nestjs/mapped-types';
import { CreateSiteVisitLogDto } from './create-site-visit-log.dto';

export class UpdateSiteVisitLogDto extends PartialType(
  CreateSiteVisitLogDto,
) {}
