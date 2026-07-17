import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UserDashboardLayout } from './models/user-dashboard-layouts.model';
import {
  AppDashboardConfig,
  LayoutItem,
  getAppConfig,
} from '@/config/dashboard-widgets.config';
import { SaveDashboardDto } from './dto/save-dashboard.dto';

const SIZE_TO_HW: Record<string, { w: number; h: number }> = {
  small: { w: 3, h: 2 },
  medium: { w: 6, h: 3 },
  large: { w: 6, h: 4 },
  full: { w: 12, h: 4 },
};

@Injectable()
export class DashboardsService {
  constructor(
    @InjectModel(UserDashboardLayout)
    private readonly layoutModel: typeof UserDashboardLayout,
  ) {}

  private requireConfig(appKey: string): AppDashboardConfig {
    const cfg = getAppConfig(appKey);

    if (!cfg) {
      throw new NotFoundException(`Unknown dashboard app "${appKey}"`);
    }

    return cfg;
  }

  /** GET /dashboards/:appKey */
  async getDashboard(userId: string, appKey: string) {
    const cfg = this.requireConfig(appKey);

    const row = await this.layoutModel.findOne({
      where: { userId, appKey },
    });

    const layout = row?.layout?.length
      ? this.reconcile(row.layout, cfg)
      : this.withRequiredWidgets(cfg.defaultLayout, cfg);

    const hiddenKeys = row?.hiddenKeys ?? [];

    return {
      layout,
      hidden_keys: hiddenKeys,
      required_keys: cfg.requiredKeys,
      default_layout: cfg.defaultLayout,
    };
  }

  /** GET /dashboards/library/:appKey */
  async getLibrary(appKey: string) {
    const cfg = this.requireConfig(appKey);

    return {
      widgets: cfg.widgets,
    };
  }

  /** PUT /dashboards/:appKey */
  async saveDashboard(userId: string, appKey: string, dto: SaveDashboardDto) {
    const cfg = this.requireConfig(appKey);

    const knownKeys = new Set(cfg.widgets.map((w) => w.key));

    let layout: LayoutItem[] = dto.layout.filter((i) => knownKeys.has(i.key));

    layout = this.withRequiredWidgets(layout, cfg);

    if (layout.length === 0) {
      throw new BadRequestException('Dashboard layout cannot be empty');
    }

    const hiddenKeys = dto.hidden_keys.filter(
      (k) => knownKeys.has(k) && !cfg.requiredKeys.includes(k),
    );

    const [row] = await this.layoutModel.findOrCreate({
      where: { userId, appKey },
      defaults: {
        userId,
        appKey,
        layout,
        hiddenKeys,
      },
    });

    row.layout = layout;
    row.hiddenKeys = hiddenKeys;

    await row.save();

    return {
      layout: row.layout,
      hidden_keys: row.hiddenKeys,
    };
  }

  /** POST /dashboards/:appKey/reset */
  async resetDashboard(userId: string, appKey: string) {
    const cfg = this.requireConfig(appKey);

    const layout = this.withRequiredWidgets(cfg.defaultLayout, cfg);

    await this.layoutModel.destroy({
      where: { userId, appKey },
    });

    await this.layoutModel.create({
      userId,
      appKey,
      layout,
      hiddenKeys: [],
    });

    return {
      layout,
      hidden_keys: [],
    };
  }

  /** Ensures every required widget exists in the layout. */
  private withRequiredWidgets(
    layout: LayoutItem[],
    cfg: AppDashboardConfig,
  ): LayoutItem[] {
    const present = new Set(layout.map((i) => i.key));

    const missing = cfg.requiredKeys.filter((k) => !present.has(k));

    if (missing.length === 0) {
      return layout;
    }

    let maxY = layout.reduce((m, i) => Math.max(m, i.y + i.h), 0);

    const additions: LayoutItem[] = missing.map((key) => {
      const widget = cfg.widgets.find((w) => w.key === key);

      const { w, h } = SIZE_TO_HW[widget?.defaultSize ?? 'small'];

      const item: LayoutItem = {
        key,
        x: 0,
        y: maxY,
        w,
        h,
      };

      maxY += h;

      return item;
    });

    return [...layout, ...additions];
  }

  /** Removes widgets that no longer exist in the catalog. */
  private reconcile(
    layout: LayoutItem[],
    cfg: AppDashboardConfig,
  ): LayoutItem[] {
    const knownKeys = new Set(cfg.widgets.map((w) => w.key));

    const filtered = layout.filter((i) => knownKeys.has(i.key));

    return this.withRequiredWidgets(filtered, cfg);
  }
}
