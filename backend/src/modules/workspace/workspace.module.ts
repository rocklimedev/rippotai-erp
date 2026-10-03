import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Note } from './note.model';
import { NotesController } from './notes.controller';
import { WorkspaceController } from './workspace.controller';
import { WorkspaceService } from './workspace.service';

/**
 * Workspace: Notes CRUD + read-only aggregate feeds used by the
 * Clients, Calendar and Activity pages.
 */
@Module({
  imports: [SequelizeModule.forFeature([Note])],
  controllers: [NotesController, WorkspaceController],
  providers: [WorkspaceService],
})
export class WorkspaceModule {}
