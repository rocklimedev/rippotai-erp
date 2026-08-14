import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { TeamMember } from './models/team-member.model';
import { TeamService } from './team.service';
import { TeamController } from './team.controller';

@Module({
  imports: [SequelizeModule.forFeature([TeamMember])],
  controllers: [TeamController],
  providers: [TeamService],
  exports: [TeamService], // other modules: `imports: [TeamModule]`, then inject TeamService
})
export class TeamModule {}
