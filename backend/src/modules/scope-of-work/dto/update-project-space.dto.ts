import { PartialType } from '@nestjs/mapped-types';
import { CreateProjectSpaceDto } from './create-project-space.dto';

export class UpdateProjectSpaceDto extends PartialType(CreateProjectSpaceDto) {}
