import { PartialType } from '@nestjs/mapped-types';
import { CreateSiteRecceDto } from './create-site-recce.dto';

export class UpdateSiteRecceDto extends PartialType(CreateSiteRecceDto) {}
