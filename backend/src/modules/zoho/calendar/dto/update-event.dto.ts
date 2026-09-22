import { PartialType } from '@nestjs/mapped-types';

import { CreateZohoEventDto } from './create-event.dto';

export class UpdateZohoEventDto extends PartialType(CreateZohoEventDto) {}
