import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Rfi } from './models/rfi.model';
import { Project } from '@/modules/projects/models/projects.model';
import { Team } from '../process-workflow/models/team.model';
import { RaiseRfiDto, RespondToRfiDto, RerouteRfiDto } from './dto/rfi.dto';
import {
  RfiStatus,
  RfiPriority,
} from '../../common/enums/site-operations.enums';

@Injectable()
export class RfiService {
  constructor(
    @InjectModel(Rfi) private rfiModel: typeof Rfi,
    @InjectModel(Team) private teamModel: typeof Team,
  ) {}

  async raise(dto: RaiseRfiDto): Promise<Rfi> {
    const team = await this.teamModel.findByPk(dto.routedToTeamId);
    if (!team)
      throw new NotFoundException(`Team ${dto.routedToTeamId} not found`);

    const nextNumber =
      (await this.rfiModel.count({ where: { projectId: dto.projectId } })) + 1;

    return this.rfiModel.create({
      projectId: dto.projectId,
      stepId: dto.stepId ?? null,
      rfiNumber: nextNumber,
      subject: dto.subject,
      query: dto.query,
      raisedBy: dto.raisedBy,
      raisedAt: dto.raisedAt ? new Date(dto.raisedAt) : new Date(),
      priority: dto.priority ?? RfiPriority.NORMAL,
      routedToTeamId: dto.routedToTeamId,
      status: RfiStatus.OPEN,
      attachmentUrls: dto.attachmentUrls ?? null,
    } as any);
  }

  async reroute(id: string, dto: RerouteRfiDto): Promise<Rfi> {
    const rfi = await this.getOrThrow(id);
    if (rfi.status === RfiStatus.CLOSED)
      throw new BadRequestException('Cannot reroute a closed RFI');

    const team = await this.teamModel.findByPk(dto.routedToTeamId);
    if (!team)
      throw new NotFoundException(`Team ${dto.routedToTeamId} not found`);

    await rfi.update({ routedToTeamId: dto.routedToTeamId } as any);
    return rfi;
  }

  /** Records the response. The RFI moves to ANSWERED; call close() separately to close it out. */
  async respond(id: string, dto: RespondToRfiDto): Promise<Rfi> {
    const rfi = await this.getOrThrow(id);
    if (rfi.status === RfiStatus.CLOSED)
      throw new BadRequestException('RFI is already closed');

    await rfi.update({
      response: dto.response,
      respondedBy: dto.respondedBy,
      respondedAt: new Date(),
      status: RfiStatus.ANSWERED,
    } as any);
    return rfi;
  }

  async close(id: string): Promise<Rfi> {
    const rfi = await this.getOrThrow(id);
    if (rfi.status !== RfiStatus.ANSWERED) {
      throw new BadRequestException(
        'RFI must be ANSWERED before it can be closed',
      );
    }
    await rfi.update({ status: RfiStatus.CLOSED, closedAt: new Date() } as any);
    return rfi;
  }

  async getOrThrow(id: string): Promise<Rfi> {
    const rfi = await this.rfiModel.findByPk(id, {
      include: [this.teamModel, { model: Project, attributes: ['id', 'name'] }],
    });
    if (!rfi) throw new NotFoundException(`RFI ${id} not found`);
    return rfi;
  }

  async listForProject(projectId: string, status?: RfiStatus): Promise<any[]> {
    return this.list({ projectId, status });
  }

  /** All RFIs, optionally for one project (UUID) and/or status, with team + project name. */
  async list({
    projectId,
    status,
  }: { projectId?: string; status?: RfiStatus } = {}): Promise<any[]> {
    const where: any = {};
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;
    const rows = await this.rfiModel.findAll({
      where,
      order: [['raisedAt', 'DESC']],
      include: [{ model: Project, attributes: ['id', 'name'] }],
    });
    // Team names attached in JS: teams.id is CHAR(36) vs INT routed_to_team_id (see qc-sign-off.service).
    const plain = rows.map((r) => r.get({ plain: true }) as any);
    const ids = [...new Set(plain.map((r) => String(r.routedToTeamId)))];
    const teams = ids.length
      ? await this.teamModel.findAll({
          where: { id: ids },
          attributes: ['id', 'name'],
        })
      : [];
    const byId = new Map(
      teams.map((t) => [String(t.get('id')), t.get({ plain: true })]),
    );
    return plain.map((r) => {
      const team = byId.get(String(r.routedToTeamId)) ?? null;
      return {
        ...r,
        team,
        routedToTeam: team,
        routedToTeamName: (team as any)?.name ?? null,
      };
    });
  }

  /** Open RFIs sitting with a specific team (e.g. the Architect's queue). */
  async listOpenForTeam(routedToTeamId: string): Promise<Rfi[]> {
    return this.rfiModel.findAll({
      where: { routedToTeamId, status: RfiStatus.OPEN },
      order: [
        ['priority', 'DESC'],
        ['raisedAt', 'ASC'],
      ],
    });
  }
}
