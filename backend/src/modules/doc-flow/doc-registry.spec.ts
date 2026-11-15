import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import { computePartLevel, findPart } from '../rbac/access-catalogue';
import { DOC_TYPES } from './doc-registry';

function controllers(dir: string, out = ''): string {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) out = controllers(p, out);
    else if (p.endsWith('.controller.ts')) out += readFileSync(p, 'utf8');
  }
  return out;
}

describe('document flow registry', () => {
  const source = controllers(join(__dirname, '..'));
  it.each(DOC_TYPES.map((d) => [d.key, d]))('%s maps to a catalogue part and real save routes', (_k, d: any) => {
    expect(findPart(d.part)).toBeDefined();
    for (const s of d.snapshot ?? []) {
      expect(source).toContain(`class ${s.controller}`);
      expect(source).toMatch(new RegExp(`@(Put|Patch|Post)\\('${s.path.replace(/[/:]/g, (m) => '\\' + m)}'\\)`));
    }
  });
  it('reviewers need every permission of the part (Full access)', () => {
    const owned = ['boq:read', 'boq:update', 'boq:create', 'boq:delete', 'boq:approve'];
    expect(computePartLevel(owned, new Set(owned)).level).toBe('full');
    expect(computePartLevel(owned, new Set(owned.slice(0, 3))).level).not.toBe('full');
  });
});
