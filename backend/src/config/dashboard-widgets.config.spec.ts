import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getAppConfig } from './dashboard-widgets.config';

describe('Design and Build dashboards', () => {
  const registry = readFileSync(
    resolve(
      __dirname,
      '../../../rippotai-erp-frontend/src/widgets/registry.jsx',
    ),
    'utf8',
  );

  it.each(['design', 'build'])(
    '%s has renderable widgets and a valid default layout',
    (app) => {
      const config = getAppConfig(app)!;
      const keys = config.widgets.map((widget) => widget.key);
      expect(new Set(keys).size).toBe(keys.length);
      for (const widget of config.widgets) {
        expect(registry).toContain(`"${widget.key}":`);
        expect(widget.locked_required).toBe(
          config.requiredKeys.includes(widget.key),
        );
      }
      for (const required of config.requiredKeys) {
        expect(config.defaultLayout.some((item) => item.key === required)).toBe(
          true,
        );
      }
      for (const [index, item] of config.defaultLayout.entries()) {
        expect(keys).toContain(item.key);
        expect(item.x + item.w).toBeLessThanOrEqual(12);
        for (const other of config.defaultLayout.slice(index + 1)) {
          const overlaps =
            item.x < other.x + other.w &&
            item.x + item.w > other.x &&
            item.y < other.y + other.h &&
            item.y + item.h > other.y;
          expect(overlaps).toBe(false);
        }
      }
    },
  );

  it('assigns finance and drawing widgets to Design and construction widgets to Build', () => {
    expect(
      getAppConfig('design')!.widgets.some((widget) =>
        widget.key.startsWith('ledger.'),
      ),
    ).toBe(true);
    const build = getAppConfig('build')!.widgets.map((widget) => widget.key);
    for (const prefix of ['inventory.', 'procurement.', 'siteops.', 'boq.']) {
      expect(build.some((key) => key.startsWith(prefix))).toBe(true);
    }
    expect(build.some((key) => key.startsWith('ledger.'))).toBe(false);
  });
});
