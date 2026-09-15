import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { User } from './models/user.model';
import { TeamMember } from './models/team-member.model';

import { Team } from '../process-workflow/models/team.model';
import { TeamSection } from './models/team-sections.model';
import { TeamSectionAccess } from './models/team-section-access.model';

import { TeamService } from './team.service';
import { TeamController } from './team.controller';

@Module({
  imports: [
    SequelizeModule.forFeature([
      User,
      Team,
      TeamMember,
      TeamSection,
      TeamSectionAccess,
    ]),
  ],

  controllers: [TeamController],

  providers: [TeamService],

  exports: [TeamService],
})
export class TeamModule {}
