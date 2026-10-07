import { Workbook } from 'exceljs';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SnagListService } from './snag-list.service';
import { SnagListExportService } from './snag-list-export.service';
import { CreateSnagListDto, UpdateSnagListDto } from './dto/snag-list.dto';
import { SnagStatus } from '@/common/enums/architect-visit.enums';

describe('Snag List documents', () => {
  const transaction = { LOCK: { UPDATE: 'UPDATE' } };
  const dto = {
    title: 'Final inspection',
    project_id: 'ad09b550-f316-481a-b460-73194c934884',
    document_date: '2026-10-07',
    items: [
      {
        floor: 'Ground',
        room: 'Kitchen',
        category: 'Carpentry',
        observation: 'Repair cabinet edge',
        photos: ['https://example.com/photo.jpg'],
        scope: 'Carpenter',
        status: SnagStatus.OPEN,
        remarks: 'Inspect again',
      },
    ],
  };
  function setup() {
    let row: any;
    const revisions: any = { create: jest.fn(async (v) => v) };
    const model: any = {
      sequelize: { transaction: jest.fn((cb) => cb(transaction)) },
      create: jest.fn(async (values) => {
        row = {
          id: 'doc',
          ...values,
          toJSON: () => ({
            id: row.id,
            title: row.title,
            revision: row.revision,
            items: row.items,
            excel_data: row.excel_data,
          }),
          update: jest.fn(async (values) => Object.assign(row, values)),
        };
        return row;
      }),
      findByPk: jest.fn(async (_id, options) => {
        if (!row) return null;
        if (options.transaction) return row;
        const { excel_data, ...metadata } = row;
        return Array.isArray(options.attributes) ? row : metadata;
      }),
      findAndCountAll: jest.fn().mockResolvedValue({ rows: [], count: 30 }),
    };
    const projects: any = {
      findByPk: jest
        .fn()
        .mockResolvedValue({ id: dto.project_id, name: 'Project A' }),
    };
    const exporter: any = {
      build: jest.fn(async (v) => Buffer.from(`Excel revision ${v.revision}`)),
    };
    return {
      service: new SnagListService(model, revisions, projects, exporter),
      model,
      revisions,
      projects,
      exporter,
    };
  }
  it('creates the whole list and revision archive together, without returning Excel in JSON', async () => {
    const { service, model, revisions } = setup();
    const saved = await service.create(dto, 'user');
    expect(saved).not.toHaveProperty('excel_data');
    expect(saved.item_count).toBe(1);
    expect(saved.open_count).toBe(1);
    expect(saved.items[0].s_no).toBe(1);
    expect(model.create).toHaveBeenCalledWith(
      expect.objectContaining({ project_name: 'Project A', revision: 1 }),
      { transaction },
    );
    expect(revisions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        snag_list_id: 'doc',
        revision: 1,
        excel_data: Buffer.from('Excel revision 1'),
      }),
      { transaction },
    );
  });
  it('preserves the previous revision and saves edits to the same document', async () => {
    const { service, revisions, model } = setup();
    await service.create(dto);
    const saved = await service.update('doc', {
      ...dto,
      revision: 1,
      items: [
        {
          ...dto.items[0],
          status: SnagStatus.CLOSED,
          observation: 'Edge repaired',
        },
      ],
    });
    expect(saved.revision).toBe(2);
    expect(saved.open_count).toBe(0);
    expect(model.create).toHaveBeenCalledTimes(1);
    expect(
      revisions.create.mock.calls[0][0].document.items[0].observation,
    ).toBe('Repair cabinet edge');
    expect(
      revisions.create.mock.calls[1][0].document.items[0].observation,
    ).toBe('Edge repaired');
    await expect(
      service.update('doc', { ...dto, revision: 1 }),
    ).rejects.toThrow('has changed');
    expect(revisions.create).toHaveBeenCalledTimes(2);
  });
  it('rejects unknown projects and blank rows without writing partial records', async () => {
    const { service, projects, model } = setup();
    await expect(
      service.create({
        ...dto,
        items: [{ ...dto.items[0], observation: ' ' }],
      }),
    ).rejects.toThrow('observation');
    projects.findByPk.mockResolvedValue(null);
    await expect(service.create(dto)).rejects.toThrow('Project not found');
    expect(model.create).not.toHaveBeenCalled();
  });
  it('validates nested rows, unsafe photo protocols, dates and edit revisions', async () => {
    expect(
      await validate(plainToInstance(CreateSnagListDto, dto)),
    ).toHaveLength(0);
    for (const input of [
      { ...dto, items: [] },
      { ...dto, document_date: '2026-02-31' },
      { ...dto, items: [{ ...dto.items[0], status: 'Unknown' }] },
      { ...dto, items: [{ ...dto.items[0], photos: ['javascript:alert(1)'] }] },
      { ...dto, items: [{ ...dto.items[0], observation: ' ' }] },
    ]) {
      expect(
        (await validate(plainToInstance(CreateSnagListDto, input))).length,
      ).toBeGreaterThan(0);
    }
    expect(
      (await validate(plainToInstance(UpdateSnagListDto, dto))).length,
    ).toBeGreaterThan(0);
  });
  it('lists all projects with pagination without loading row and Excel payloads', async () => {
    const { service, model } = setup();
    const listed = await service.list({ page: 2, limit: 20 });
    expect(listed.meta.total_pages).toBe(2);
    expect(model.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {},
        offset: 20,
        attributes: { exclude: ['items', 'excel_data'] },
      }),
    );
    await expect(service.download('missing')).rejects.toThrow('not found');
  });
  it('exports only the Snag list sheet, all nine fields and rows beyond the template', async () => {
    const service = new SnagListExportService();
    const buffer = await service.build({
      ...dto,
      project_name: 'Project A',
      revision: 2,
      items: Array.from({ length: 30 }, (_, index) => ({
        ...dto.items[0],
        observation: index === 0 ? '=SUM(A1:A2)' : `Observation ${index}`,
      })),
    });
    const book = new Workbook();
    await book.xlsx.load(buffer as any);
    expect(book.worksheets).toHaveLength(1);
    const sheet = book.getWorksheet('Snag list')!;
    expect(sheet.getCell('A1').value).toBe(dto.title);
    expect(sheet.getCell('A2').value).toContain('Revision 2');
    expect(sheet.getCell('E4').value).toBe('=SUM(A1:A2)');
    expect(sheet.getCell('F4').value).toEqual(
      expect.objectContaining({ hyperlink: dto.items[0].photos[0] }),
    );
    expect(sheet.getCell('I4').value).toBe('Inspect again');
    expect(sheet.getCell('A33').value).toBe(30);
    expect(sheet.getCell('E33').value).toBe('Observation 29');
    expect(sheet.getCell('H4').dataValidation.formulae).toEqual([
      '"Open,In Progress,Rectified,Closed"',
    ]);
  });
});
