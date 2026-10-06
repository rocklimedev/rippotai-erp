import { VisitAssignment } from '../site-operations/models/visit-assignment.model';
import { SiteVisitLog } from '../site-operations/models/site-visit-log.model';
import { QcSignOff } from '../site-operations/models/qc-sign-off.model';
import { QcSignOffItemResult } from '../site-operations/models/qc-sign-off-item-result.model';
import { Mockup } from '../site-operations/models/mockup.model';
import { ChecklistTemplate } from '../site-operations/models/checklist-template.model';
import { ChecklistTemplateItem } from '../site-operations/models/checklist-template-item.model';
import { StepTeam } from './models/step-team.model';
import { ProjectStepProgress } from './models/project-step-progress.model';
import { ProjectDeliverableRecord } from './models/project-deliverable-record.model';
import { GateLog } from './models/gate-log.model';
import { Deliverable } from './models/deliverable.model';
import { ContinuityRole } from './models/continuity-role.model';
import 'reflect-metadata';
import { getAttributes, DataType } from 'sequelize-typescript';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ParseUUIDPipe } from '@nestjs/common';
import { Phase } from './models/phase.model';
import { Step } from './models/step.model';
import { Team } from './models/team.model';
import { Rfi } from '../site-operations/models/rfi.model';
import { DailySiteReport } from '../site-operations/models/daily-site-report.model';
import { ManpowerEntry } from '../site-operations/models/manpower-entry.model';
import { RaiseRfiDto } from '../site-operations/dto/rfi.dto';
import { CreateStepDto } from './dto/library.dto';
import { LibraryService } from './library.service';

const id = 'a13e7b39-952a-5a15-97f4-d6868fb3ce75';

describe('UUID identities across workflow and site operations', () => {
  it.each([
    ContinuityRole,
    Deliverable,
    GateLog,
    Phase,
    ProjectDeliverableRecord,
    ProjectStepProgress,
    StepTeam,
    Step,
    Team,
    ChecklistTemplateItem,
    ChecklistTemplate,
    DailySiteReport,
    ManpowerEntry,
    Mockup,
    QcSignOffItemResult,
    QcSignOff,
    Rfi,
    SiteVisitLog,
    VisitAssignment,
  ])('%s generates UUIDs and never auto-increments', (model) => {
    const attributes = getAttributes(model.prototype);
    expect(attributes.id.primaryKey).toBe(true);
    expect(attributes.id.defaultValue).toBe(DataType.UUIDV4);
    expect(attributes.id.type.toString()).toBe('CHAR(36)');
    expect(attributes.id.autoIncrement).toBeUndefined();
  });

  it('keeps business quantities numeric while foreign keys use UUID columns', () => {
    expect(getAttributes(Step.prototype).phaseId.type.toString()).toBe(
      'CHAR(36)',
    );
    expect(getAttributes(Step.prototype).order.type).toBe(DataType.INTEGER);
    expect(getAttributes(Rfi.prototype).routedToTeamId.type.toString()).toBe(
      'CHAR(36)',
    );
    expect(getAttributes(Rfi.prototype).rfiNumber.type).toBe(DataType.INTEGER);
    expect(
      getAttributes(ManpowerEntry.prototype).dailySiteReportId.type.toString(),
    ).toBe('CHAR(36)');
    expect(getAttributes(ManpowerEntry.prototype).headcount.type).toBe(
      DataType.INTEGER,
    );
  });

  it('accepts UUID request identities and rejects legacy integers', async () => {
    const values = {
      projectId: id,
      routedToTeamId: id,
      stepId: id,
      subject: 'Question',
      query: 'Please confirm',
      raisedBy: 'Supervisor',
    };
    expect(await validate(plainToInstance(RaiseRfiDto, values))).toEqual([]);
    const invalid = await validate(
      plainToInstance(RaiseRfiDto, { ...values, routedToTeamId: 1 }),
    );
    expect(invalid.some((error) => error.property === 'routedToTeamId')).toBe(
      true,
    );
    expect(
      await validate(
        plainToInstance(CreateStepDto, {
          phaseId: id,
          name: 'Survey',
          code: 'SURVEY',
          order: 1,
        }),
      ),
    ).toEqual([]);
    const pipe = new ParseUUIDPipe();
    expect(await pipe.transform(id, { type: 'param' })).toBe(id);
    await expect(pipe.transform('1', { type: 'param' })).rejects.toThrow();
  });

  it('passes UUIDs unchanged through service lookups', async () => {
    const model = { findByPk: jest.fn().mockResolvedValue({ id }) };
    const library = new LibraryService(
      model as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );
    await library.getPhaseOrThrow(id);
    expect(model.findByPk).toHaveBeenCalledWith(id);
  });
});
