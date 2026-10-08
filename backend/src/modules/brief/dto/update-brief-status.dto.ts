import { IsEnum } from 'class-validator';
import { ProjectBriefStatus } from '@/common/types/project-brief.types';

export class UpdateBriefStatusDto {
  @IsEnum(ProjectBriefStatus)
  status: ProjectBriefStatus;
}
