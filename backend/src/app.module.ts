import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { SequelizeModuleOptions } from '@nestjs/sequelize';

import databaseConfig from './config/database.config';

import { AppController } from './app.controller';
import { AppService } from './app.service';

// RBAC / Auth
import { AuthModule } from './modules/auth/auth.module';
import { RolesModule } from './modules/rbac/rbac.module';
import { AppsModule } from './modules/rbac/app.module';

// Core
import { UsersModule } from './modules/users/users.module';
import { SettingsModule } from './modules/settings/settings.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { ClientsModule } from './modules/clients/clients.module';
import { VendorsModule } from './modules/vendors/vendors.module';

// Engagement
import { ActivityLogsModule } from './modules/engagement/activity-logs.module';
import { NotificationsModule } from './modules/engagement/notifications.module';

// Quotations / BOQ
import { QuotationsModule } from './modules/quotations/quotations.module';

import { BoqModule } from './modules/boqs/boq.module';

// Meta
import { UnitsModule } from './modules/metas/units.module';
import { TermsModule } from './modules/metas/terms.module';

// Documents
import { DocumentsModule } from './modules/documents/document.module';
import { DrawingsModule } from './modules/documents/drawing.module';

// Project / Site
import { BriefModule } from './modules/brief/brief.module';
import { SiteRecceModule } from './modules/reki/reki.module';
import { TasksModule } from './modules/tasks/task.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { DashboardsModule } from './modules/dashboard/dashboard.module';
import { LeadsModule } from './modules/leads/leads.module';

// Infrastructure
import { CdnModule } from './modules/cdn/cdn.module';
import { SearchModule } from './modules/search/search.module';

// Reports
import { ReportsModule } from './modules/reports/reports.module';
import { TeamModule } from './modules/users/team.module';
import { PlanOfActionsModule } from './modules/projects/plan-of-actions.module';

@Module({
  imports: [
    // ============================================================
    // Configuration
    // ============================================================
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [databaseConfig],
    }),

    // ============================================================
    // Database
    // ============================================================
    SequelizeModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService): SequelizeModuleOptions =>
        config.getOrThrow<SequelizeModuleOptions>('database'),
    }),

    // ============================================================
    // Authentication / RBAC
    // ============================================================
    AuthModule,
    RolesModule,
    AppsModule,

    // ============================================================
    // Core
    // ============================================================
    UsersModule,
    TeamModule,
    SettingsModule,
    ProjectsModule,
    ClientsModule,
    VendorsModule,
    PlanOfActionsModule,
    // ============================================================
    // Engagement
    // ============================================================
    ActivityLogsModule,
    NotificationsModule,

    // ============================================================
    // Quotations / BOQ
    // ============================================================
    QuotationsModule,

    BoqModule,

    // ============================================================
    // Meta
    // ============================================================
    UnitsModule,
    TermsModule,

    // ============================================================
    // Documents
    // ============================================================
    DocumentsModule,
    DrawingsModule,

    // ============================================================
    // Project / Site
    // ============================================================
    BriefModule,
    SiteRecceModule,
    TasksModule,
    CalendarModule,
    DashboardsModule,
    LeadsModule,

    // ============================================================
    // Infrastructure
    // ============================================================
    CdnModule,
    SearchModule,

    // ============================================================
    // Reports
    // ============================================================
    ReportsModule,
  ],

  controllers: [AppController],

  providers: [AppService],
})
export class AppModule {}
