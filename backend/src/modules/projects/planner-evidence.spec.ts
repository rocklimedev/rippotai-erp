import { coreWords, evidenceFor, matchScore } from './planner-evidence';

const row = (phase_code: string, name: string, created_at = '2026-08-03T10:00:00Z') => ({ phase_code, name, title: name, created_at });
const item = (title: string, work_name: string, details: string | null = null) => ({ work_name, details, phase: { module: 'CONSULTANCY', title } });

describe('planner evidence', () => {
  const rows = [
    row('06_TENDER', 'Tender – Electrical'),
    row('06_TENDER', 'Tender – Building Layout'),
    row('07_WORKING', 'Bathroom Details', '2026-09-10T00:00:00Z'),
    row('07_WORKING', 'Kitchen Details'),
    row('07_WORKING', 'Wardrobe & Storage Details'),
    row('05_DESIGN', 'Design Development 02 – With Material'),
    row('03_PRE_DESIGN', 'Existing Layout – As-Built', '2026-04-09T00:00:00Z'),
    row('03_PRE_DESIGN', 'Pitch Presentation'),
  ];
  it('matches by meaning words inside the phase', () => {
    expect(evidenceFor(item('TENDER DRAWINGS', 'ELECTRICAL LAYOUT'), rows)?.title).toBe('Tender – Electrical');
    expect(evidenceFor(item('WORKING DRAWINGS', 'BATHROOM DETAILS'), rows)?.date).toBe('2026-09-10');
    expect(evidenceFor(item('WORKING DRAWINGS', 'FIXED FURNITURE DETAILS', 'KITCHEN'), rows)?.title).toBe('Kitchen Details');
    expect(evidenceFor(item('PRE-DESIGN', 'EXISTING LAYOUT'), rows)?.date).toBe('2026-04-09');
    expect(evidenceFor(item('PRE-DESIGN', 'PITCH PROPOSAL'), rows)?.title).toBe('Pitch Presentation');
  });
  it('does not mix numbered documents or phases', () => {
    expect(evidenceFor(item('DESIGN', 'DESIGN DEVELOPMENT 01'), rows)).toBeNull();
    expect(evidenceFor(item('WORKING DRAWINGS', 'ELECTRICAL LAYOUT'), rows)).toBeNull();
    expect(evidenceFor(item('WORKING DRAWINGS', 'FIXED FURNITURE DETAILS', 'CROCKERY'), rows)).toBeNull();
    expect(evidenceFor(item('WORKING DRAWINGS', 'FIXED FURNITURE DETAILS', 'BAR UNIT'), [...rows, row('07_WORKING', 'TV Unit Details')])).toBeNull();
    expect(evidenceFor(item('PRE-DESIGN', 'EXISTING LAYOUT', 'NULL'), rows)?.title).toContain('Existing');
    expect(evidenceFor({ work_name: 'FOUNDATION', details: null, phase: { module: 'PMC', title: 'CIVIL WORK' } }, rows)).toBeNull();
  });
  it('core words drop generic words', () => {
    expect([...coreWords('Tender – Section & Elevations')]).toEqual(['section', 'elevation']);
    expect(matchScore(coreWords('WALL ELEVATION'), coreWords('Wall Elevations'))).toBeGreaterThan(0);
  });
});
