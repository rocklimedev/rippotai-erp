import {
  clientFactPatch,
  formatSize,
  parseSize,
  projectFactPatch,
} from './deal-project-link';

describe('deal -> project / client facts', () => {
  it.each([
    ['2500 sq ft', 2500, 'SQ_FT'],
    ['2,500 sqft', 2500, 'SQ_FT'],
    ['200 gaj', 200, 'GAJ'],
    ['300 sq yd', 300, 'GAJ'],
    ['185.5 sqm', 185.5, 'SQ_M'],
    ['4000', 4000, 'SQ_FT'],
  ])('parses size "%s"', (text, area, unit) => {
    expect(parseSize(text)).toEqual({ area, unit });
  });

  it('ignores sizes without a number', () => {
    expect(parseSize('large plot')).toBeNull();
    expect(parseSize('')).toBeNull();
  });

  it('formats project area back for the deal', () => {
    expect(formatSize('350.00', 'SQ_M')).toBe('350 sq m');
    expect(formatSize(null, 'GAJ')).toBeNull();
  });

  const facts = {
    location: 'Sainik Farms',
    projectTypeId: 'type-1',
    size: '200 gaj',
    budget: 8500000,
    expectedClose: '2026-12-20',
    description: 'G+2',
  };

  it('fills only empty project fields', () => {
    const patch = projectFactPatch(
      { site_location: 'Typed in brief', site_area: null, client_budget: 0 },
      facts,
    );
    expect(patch).toEqual({
      project_type_id: 'type-1',
      site_area: 200,
      site_area_unit: 'GAJ',
      description: 'G+2',
      desired_start_date: '2026-12-20',
    });
  });

  it('writes through a field the user just edited on the deal', () => {
    const patch = projectFactPatch(
      { site_location: 'Old address', site_area: 100, site_area_unit: 'SQ_FT' },
      { location: 'New address', size: '200 gaj' },
      new Set(['site_location']),
    );
    expect(patch).toEqual({ site_location: 'New address' });
  });

  it('fills empty client contact fields and keeps typed ones', () => {
    expect(
      clientFactPatch(
        { contact_person: null, phone: '9000000000', email: '' },
        { name: 'Kabir', phone: '9811122233', email: 'k@x.com' },
      ),
    ).toEqual({ contact_person: 'Kabir', email: 'k@x.com' });
    expect(
      clientFactPatch(
        { phone: '9000000000' },
        { phone: '9811122233' },
        new Set(['phone']),
      ),
    ).toEqual({ phone: '9811122233' });
  });
});
