import { PartialType } from '@nestjs/mapped-types';
import { CreateSiteReccePhotoDto } from './create-site-recce-photo.dto';

export class UpdateSiteReccePhotoDto extends PartialType(
  CreateSiteReccePhotoDto,
) {}
