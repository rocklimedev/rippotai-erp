import { PartialType } from '@nestjs/mapped-types';
import { CreateZohoTaskDto } from './create-task.dto';

export class UpdateZohoTaskDto extends PartialType(CreateZohoTaskDto) {}
