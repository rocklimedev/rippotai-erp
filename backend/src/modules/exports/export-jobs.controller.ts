import {
  ConflictException,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { RequirePermission } from '../../common/decorator/require-permission.decorator';
import { CdnService } from '../cdn/cdn.service';
import { ExportJobsService } from './export-jobs.service';

@Controller('export-jobs')
export class ExportJobsController {
  constructor(
    private readonly jobs: ExportJobsService,
    private readonly storage: CdnService,
  ) {}

  @RequirePermission('exports:read-own')
  @Get(':id')
  status(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.jobs.status(id, req.user);
  }

  @RequirePermission('exports:read-own')
  @Get(':id/result')
  async result(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const job = await this.jobs.owned(id, req.user);
    if ((await job.getState()) !== 'completed')
      throw new ConflictException('Export is not complete');
    const result = (await this.jobs.owned(id, req.user)).returnvalue;
    if (!result)
      throw new ConflictException('Export result is not yet available');
    res.setHeader('Cache-Control', 'private, no-store');
    if (result.type === 'json') return res.json(result.value);
    const filename = result.filename.replace(/[^\w. -]/g, '_');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', result.mime);
    await this.storage.streamFile(result.key, res);
  }

  @RequirePermission('exports:retry-own')
  @Post(':id/retry')
  retry(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    return this.jobs
      .retry(id, req.user)
      .then((job) => res.status(202).json(job));
  }
}
