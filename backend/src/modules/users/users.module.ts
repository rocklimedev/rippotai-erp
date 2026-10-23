import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

// ============================================================
// USER MODELS
// ============================================================

import { User } from './models/user.model';
import { AuthToken } from '../auth/models/auth-token.model';
import { ActivityLog } from '../engagement/models/activity-log.model';
import { ManualEmailVerificationService } from './manual-email-verification.service';
import { EmailVerificationService } from '../auth/email-verification.service';
import { VerificationToken } from '../auth/models/verification-token.model';
import { MailService } from '@/common/mail/mail.service';
import { UserSignature } from './models/user-signature.model';

// ============================================================
// TEAM MODELS
// ============================================================

import { Team } from './models/team.model';
import { TeamMember } from './models/team-member.model';
import { TeamSection } from './models/team-sections.model';
import { TeamSectionAccess } from './models/team-section-access.model';

// ============================================================
// USER SERVICES
// ============================================================

import { UsersService } from './users.service';
import { UserSignaturesService } from './user-signature.service';

// ============================================================
// TEAM SERVICE
// ============================================================

import { TeamService } from './team.service';

// ============================================================
// USER CONTROLLERS
// ============================================================

import { UsersController } from './users.controller';
import { UserSignatureController } from './user-signature.controller';

// ============================================================
// TEAM CONTROLLER
// ============================================================

import { TeamController } from './team.controller';

// ============================================================
// MODULES
// ============================================================

import { CdnModule } from '../cdn/cdn.module';
import { NotificationsModule } from '../engagement/notifications.module';
import { ActivityLogsModule } from '../engagement/activity-logs.module';
import { RolesModule } from '../rbac/rbac.module';
import { RolePermissionsCacheModule } from '../rbac/role-permissions-cache';

@Module({
  imports: [
    RolePermissionsCacheModule,
    // ==========================================================
    // SEQUELIZE MODELS
    // ==========================================================

    SequelizeModule.forFeature([
      // Users
      User,
      AuthToken,
      VerificationToken,
      ActivityLog,
      UserSignature,

      // Teams
      Team,
      TeamMember,
      TeamSection,
      TeamSectionAccess,
    ]),

    // ==========================================================
    // DEPENDENCY MODULES
    // ==========================================================

    CdnModule,
    RolesModule,
    NotificationsModule,
    ActivityLogsModule,
  ],

  // ============================================================
  // CONTROLLERS
  // ============================================================

  controllers: [
    UsersController,
    UserSignatureController,

    // Team Management
    TeamController,
  ],

  // ============================================================
  // SERVICES
  // ============================================================

  providers: [
    EmailVerificationService,
    MailService,
    ManualEmailVerificationService,
    UsersService,
    UserSignaturesService,

    // Team Management
    TeamService,
  ],

  // ============================================================
  // EXPORTS
  // ============================================================

  exports: [UsersService, TeamService],
})
export class UsersModule {}
