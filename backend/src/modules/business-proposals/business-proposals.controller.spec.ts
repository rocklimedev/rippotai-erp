import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  BusinessProposalsController,
  SaveBusinessProposalDto,
} from './business-proposals.controller';
import { Project } from '../projects/models/projects.model';

describe('Business proposal snapshots', () => {
  const body = {
    project_id: 'bd46f949-127d-4a25-8f6f-7b8e5d33b67c',
    title: 'Saved proposal',
    snapshot: {
      schemaVersion: 1,
      proposal: { nextSteps: { steps: [] } },
      docs: { project: { name: 'Original project' } },
    },
  };
  afterEach(() => jest.restoreAllMocks());
  it('stores the full snapshot and actor when creating a proposal', async () => {
    jest
      .spyOn(Project, 'findByPk')
      .mockResolvedValue({ id: body.project_id } as any);
    const model = { create: jest.fn().mockResolvedValue({ id: 'saved' }) };
    const controller = new BusinessProposalsController(model as any);
    await controller.create(body, { id: 'actor' });
    expect(model.create).toHaveBeenCalledWith({
      ...body,
      created_by: 'actor',
      updated_by: 'actor',
    });
  });
  it('reads the stored snapshot without loading current source documents', async () => {
    const model = { findByPk: jest.fn().mockResolvedValue(body) };
    const projectRead = jest.spyOn(Project, 'findByPk');
    expect(
      await new BusinessProposalsController(model as any).get('saved'),
    ).toEqual(body);
    expect(projectRead).not.toHaveBeenCalled();
  });
  it('updates an existing snapshot without creating another record', async () => {
    jest
      .spyOn(Project, 'findByPk')
      .mockResolvedValue({ id: body.project_id } as any);
    const update = jest.fn();
    const model = { findByPk: jest.fn().mockResolvedValue({ update }) };
    await new BusinessProposalsController(model as any).update('saved', body, {
      id: 'editor',
    });
    expect(update).toHaveBeenCalledWith({ ...body, updated_by: 'editor' });
  });
  it('rejects missing records and projects', async () => {
    const controller = new BusinessProposalsController({
      findByPk: jest.fn().mockResolvedValue(null),
    } as any);
    await expect(controller.get('missing')).rejects.toThrow(
      'Business proposal not found',
    );
    jest.spyOn(Project, 'findByPk').mockResolvedValue(null);
    await expect(controller.create(body, { id: 'actor' })).rejects.toThrow(
      'Project not found',
    );
  });
  it('validates project identity, title and snapshot payload', async () => {
    expect(
      await validate(plainToInstance(SaveBusinessProposalDto, body)),
    ).toHaveLength(0);
    expect(
      (
        await validate(
          plainToInstance(SaveBusinessProposalDto, {
            project_id: 'bad',
            title: '',
            snapshot: 'bad',
          }),
        )
      ).length,
    ).toBeGreaterThan(0);
  });
});
