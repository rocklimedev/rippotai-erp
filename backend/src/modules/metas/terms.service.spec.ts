import { TermsService } from './terms.service';
import { TermsScope } from '../../common/enums/terms.enums';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateTermsTemplateDto } from './dto/update-terms-template.dto';

describe('terms template lifecycle', () => {
  const transaction = { LOCK: { UPDATE: 'UPDATE' } };
  function setup() {
    const template = {
      id: 'terms',
      current_version: 2,
      is_active: true,
      content_html: 'Current',
      update: jest.fn(),
    };
    const templates = {
      create: jest.fn().mockResolvedValue(template),
      findByPk: jest.fn().mockResolvedValue(template),
      findAll: jest.fn(),
    };
    const versions = {
      create: jest.fn(),
      findOne: jest
        .fn()
        .mockResolvedValue({ version: 1, content_html: 'Original' }),
    };
    const sequelize = { transaction: jest.fn((fn) => fn(transaction)) };
    return {
      service: new TermsService(
        templates as any,
        versions as any,
        sequelize as any,
      ),
      templates,
      versions,
      template,
    };
  }

  it('creates a template and its first immutable version in one transaction', async () => {
    const { service, templates, versions } = setup();
    await service.create(
      {
        name: ' Standard ',
        scope: TermsScope.GLOBAL,
        content_html: '<ol><li>Payment</li></ol>',
      },
      'actor',
    );
    expect(templates.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Standard', current_version: 1 }),
      { transaction },
    );
    expect(versions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        terms_template_id: 'terms',
        version: 1,
        created_by: 'actor',
      }),
      { transaction },
    );
  });

  it('locks the template before allocating the next version', async () => {
    const { service, templates, versions, template } = setup();
    await service.updateContent('terms', {
      content_html: 'Revised',
      change_note: 'New payment terms',
    });
    expect(templates.findByPk).toHaveBeenCalledWith('terms', {
      transaction,
      lock: 'UPDATE',
    });
    expect(versions.create).toHaveBeenCalledWith(
      expect.objectContaining({ version: 3, content_html: 'Revised' }),
      { transaction },
    );
    expect(template.update).toHaveBeenCalledWith(
      expect.objectContaining({ current_version: 3 }),
      { transaction },
    );
  });

  it('rejects blank wording and preserves pinned historical content', async () => {
    const { service, versions } = setup();
    await expect(
      service.updateContent('terms', { content_html: '  ' }),
    ).rejects.toThrow('empty');
    expect(versions.create).not.toHaveBeenCalled();
    expect(await service.resolveSnapshot('terms', 1)).toEqual({
      terms_template_id: 'terms',
      terms_template_version: 1,
      content_html: 'Original',
    });
    versions.findOne.mockResolvedValueOnce(null);
    await expect(service.resolveSnapshot('terms', 99)).rejects.toThrow(
      'not found',
    );
  });

  it('keeps inactive terms visible to management and excludes them from pickers', async () => {
    const { service, templates, template } = setup();
    await service.findAll();
    expect(templates.findAll).toHaveBeenLastCalledWith(
      expect.objectContaining({ where: { is_active: true } }),
    );
    await service.findAll(undefined, true);
    expect(templates.findAll).toHaveBeenLastCalledWith(
      expect.objectContaining({ where: {} }),
    );
    template.is_active = false;
    await expect(service.resolveSnapshot('terms')).rejects.toThrow('inactive');
    expect(
      await validate(
        plainToInstance(UpdateTermsTemplateDto, { is_active: false }),
        { whitelist: true, forbidNonWhitelisted: true },
      ),
    ).toEqual([]);
  });
});
