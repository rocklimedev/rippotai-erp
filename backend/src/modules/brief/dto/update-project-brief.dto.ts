import { PartialType } from '@nestjs/mapped-types';
import { CreateProjectBriefDto } from './create-project-brief.dto';

export class UpdateProjectBriefDto extends PartialType(CreateProjectBriefDto) {}
