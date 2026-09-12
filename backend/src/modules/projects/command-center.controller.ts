import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth-guard';
// Adjust to your actual guard — every route here assumes an authenticated
// req.user shaped like ActorContext (id, email, role, isAdmin).

import { ActorContext, CommandCenterService } from './command-center.service';
import {
  ActivityQueryDto,
  ApproveGateDto,
  CompleteTaskDto,
  PortfolioQueryDto,
  ReviewDocumentDto,
  UploadDocumentDto,
} from './dto/command-center.dto';

interface AuthedRequest {
  user: {
    id: string;
    email: string;
    role: string;
    roleName?: string;
    permissions?: string[];
    isAdmin?: boolean;
    name?: string;
  };
  ip?: string;
  headers: Record<string, string | string[] | undefined>;
}

@ApiTags('Command Center')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('command-center')
export class CommandCenterController {
  constructor(private readonly commandCenterService: CommandCenterService) {}

  private actorFrom(req: AuthedRequest): ActorContext {
    return {
      id: req.user.id,
      email: req.user.email,
      role: req.user.roleName ?? req.user.role,
      permissions: req.user.permissions ?? [],
      isAdmin: req.user.permissions?.includes('documents:approve'),
      name: req.user.name,
      ip: req.ip ?? null,
      userAgent: (req.headers['user-agent'] as string) ?? null,
    };
  }

  @Get('kpis')
  getKpis() {
    return this.commandCenterService.getKpis();
  }

  @Get('portfolio')
  getPortfolio(@Query() query: PortfolioQueryDto) {
    return this.commandCenterService.getPortfolio(query);
  }

  @Get('projects/:projectId/phases')
  getProjectPhases(@Param('projectId') projectId: string) {
    return this.commandCenterService.getProjectPhases(projectId);
  }

  @Get('projects/:projectId/phases/:phaseId')
  getPhaseDetail(
    @Param('projectId') projectId: string,
    @Param('phaseId') phaseId: string,
  ) {
    return this.commandCenterService.getPhaseDetail(projectId, phaseId);
  }

  @Get('actions')
  getActionRequired() {
    return this.commandCenterService.getActionRequired();
  }

  @Get('documents')
  getDocumentControl() {
    return this.commandCenterService.getDocumentControl();
  }

  @Post('projects/:projectId/documents/upload')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  uploadDocument(
    @Param('projectId') projectId: string,
    @Body() dto: UploadDocumentDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: AuthedRequest,
  ) {
    return this.commandCenterService.uploadDocument(
      projectId,
      dto,
      file,
      this.actorFrom(req),
    );
  }

  @Post('documents/:documentId/review')
  reviewDocument(
    @Param('documentId') documentId: string,
    @Body() dto: ReviewDocumentDto,
    @Req() req: AuthedRequest,
  ) {
    return this.commandCenterService.reviewDocument(
      documentId,
      dto,
      this.actorFrom(req),
    );
  }

  @Get('tasks')
  getTaskQc() {
    return this.commandCenterService.getTaskQc();
  }

  @Post('projects/:projectId/tasks/:taskDefinitionId/complete')
  completeTask(
    @Param('projectId') projectId: string,
    @Param('taskDefinitionId') taskDefinitionId: string,
    @Body() dto: CompleteTaskDto,
    @Req() req: AuthedRequest,
  ) {
    return this.commandCenterService.completeTask(
      projectId,
      taskDefinitionId,
      dto,
      this.actorFrom(req),
    );
  }

  @Post('projects/:projectId/phases/:phaseId/approve-gate')
  approveGate(
    @Param('projectId') projectId: string,
    @Param('phaseId') phaseId: string,
    @Body() dto: ApproveGateDto,
    @Req() req: AuthedRequest,
  ) {
    return this.commandCenterService.approveGate(
      projectId,
      phaseId,
      dto,
      this.actorFrom(req),
    );
  }

  @Get('commercial')
  getCommercial() {
    return this.commandCenterService.getCommercial();
  }

  @Get('team-workload')
  getTeamWorkload() {
    return this.commandCenterService.getTeamWorkload();
  }

  @Get('activity')
  getActivity(@Query() query: ActivityQueryDto) {
    return this.commandCenterService.getActivity(
      query.limit,
      query.entityType,
      query.entityId,
    );
  }
}
