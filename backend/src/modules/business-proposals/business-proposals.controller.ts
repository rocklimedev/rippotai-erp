import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  ParseUUIDPipe,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import {
  IsNotEmpty,
  IsObject,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { Op } from 'sequelize';
import { JwtAuthGuard } from '@/common/guards/jwt-auth-guard';
import { CurrentUser } from '@/common/decorator/current-user.decorator';
import { Project } from '../projects/models/projects.model';
import { BusinessProposal } from './business-proposal.model';
export class SaveBusinessProposalDto {
  @IsUUID() project_id: string;
  @IsString() @IsNotEmpty() @MaxLength(255) title: string;
  @IsObject() snapshot: Record<string, any>;
}
@Controller('business-proposals')
@UseGuards(JwtAuthGuard)
export class BusinessProposalsController {
  constructor(
    @InjectModel(BusinessProposal)
    private readonly proposals: typeof BusinessProposal,
  ) {}
  @Get() list(
    @Query('project_id') projectId?: string,
    @Query('search') search?: string,
  ) {
    return this.proposals.findAll({
      where: {
        ...(projectId ? { project_id: projectId } : {}),
        ...(search ? { title: { [Op.like]: `%${search}%` } } : {}),
      },
      attributes: { exclude: ['snapshot'] },
      order: [['updatedAt', 'DESC']],
    });
  }
  @Get(':id') async get(@Param('id', ParseUUIDPipe) id: string) {
    const proposal = await this.proposals.findByPk(id);
    if (!proposal) throw new NotFoundException('Business proposal not found');
    return proposal;
  }
  @Post() async create(
    @Body() body: SaveBusinessProposalDto,
    @CurrentUser() user: any,
  ) {
    if (!(await Project.findByPk(body.project_id)))
      throw new NotFoundException('Project not found');
    return this.proposals.create({
      ...body,
      created_by: user.id,
      updated_by: user.id,
    });
  }
  @Put(':id') async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: SaveBusinessProposalDto,
    @CurrentUser() user: any,
  ) {
    const proposal = await this.get(id);
    if (!(await Project.findByPk(body.project_id)))
      throw new NotFoundException('Project not found');
    return proposal.update({ ...body, updated_by: user.id });
  }
}
