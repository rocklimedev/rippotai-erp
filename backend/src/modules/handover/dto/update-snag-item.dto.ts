import { PartialType } from '@nestjs/mapped-types';
import { CreateSnagItemDto } from './create-snag-item.dto';

export class UpdateSnagItemDto extends PartialType(CreateSnagItemDto) {}
