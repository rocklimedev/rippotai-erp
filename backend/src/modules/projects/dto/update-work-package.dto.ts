import { PartialType } from '@nestjs/mapped-types';
import { CreateWorkPackageDto } from './create-work-package.dto';

export class UpdateWorkPackageDto extends PartialType(CreateWorkPackageDto) {}
