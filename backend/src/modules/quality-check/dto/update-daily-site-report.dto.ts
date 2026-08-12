import { PartialType } from '@nestjs/mapped-types';
import { CreateDailySiteReportDto } from './create-daily-site-report.dto';

export class UpdateDailySiteReportDto extends PartialType(
  CreateDailySiteReportDto,
) {}
