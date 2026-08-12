import { PartialType } from '@nestjs/mapped-types';
import { CreateSiteMockupDto } from './create-site-mockup.dto';

export class UpdateSiteMockupDto extends PartialType(CreateSiteMockupDto) {}
