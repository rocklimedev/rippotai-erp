import { PartialType } from '@nestjs/mapped-types';
import { CreateSnagListDto } from './create-snag-list.dto';

export class UpdateSnagListDto extends PartialType(CreateSnagListDto) {}
