import { RequirePermission } from '@/common/decorator/require-permission.decorator';
import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { QueryTypes, Sequelize } from 'sequelize';
import { randomUUID } from 'crypto';

import { JwtAuthGuard } from '@/common/guards/jwt-auth-guard';
import { CurrentUser } from '@/common/decorator/current-user.decorator';

interface SavedSearch {
  id: string;
  name: string;
  filters: Record<string, unknown>;
  scope: string;
  createdAt: string;
}

/**
 * Per-user saved vendor-directory filters, kept in the `settings` table under
 * `vendor_saved_searches:<userId>` (no dedicated table needed).
 * Registered before VendorsController so `vendors/:id` doesn't swallow it.
 */
@Controller('vendors/saved-searches')
@UseGuards(JwtAuthGuard)
export class VendorSavedSearchesController {
  constructor(@InjectConnection() private readonly sequelize: Sequelize) {}

  private key(userId: string) {
    return `vendor_saved_searches:${userId}`;
  }

  private async load(userId: string): Promise<SavedSearch[]> {
    const rows = await this.sequelize.query<{ value: string }>(
      'SELECT `value` FROM settings WHERE `key` = :key LIMIT 1',
      { replacements: { key: this.key(userId) }, type: QueryTypes.SELECT },
    );
    try {
      const list = JSON.parse(rows[0]?.value ?? '[]');
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  }

  private async save(userId: string, list: SavedSearch[]) {
    await this.sequelize.query(
      'INSERT INTO settings (id, `key`, `value`, updated_by) VALUES (:id, :key, :value, :userId) ' +
        'ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), updated_by = VALUES(updated_by)',
      {
        replacements: {
          id: randomUUID(),
          key: this.key(userId),
          value: JSON.stringify(list),
          userId,
        },
      },
    );
  }

  @RequirePermission('vendors-saved-searches:read')
  @Get()
  list(@CurrentUser() user: { id: string }) {
    return this.load(user.id);
  }

  @RequirePermission('vendors-saved-searches:create')
  @Post()
  async create(
    @CurrentUser() user: { id: string },
    @Body() body: { name?: string; filters?: Record<string, unknown>; scope?: string },
  ) {
    const list = await this.load(user.id);
    const item: SavedSearch = {
      id: randomUUID(),
      name: String(body?.name || 'Saved search').slice(0, 120),
      filters: body?.filters ?? {},
      scope: body?.scope || 'personal',
      createdAt: new Date().toISOString(),
    };
    await this.save(user.id, [...list, item]);
    return item;
  }

  @RequirePermission('vendors-saved-searches:delete')
  @Delete(':id')
  async remove(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    const list = await this.load(user.id);
    if (!list.some((s) => s.id === id)) {
      throw new NotFoundException('Saved search not found');
    }
    await this.save(
      user.id,
      list.filter((s) => s.id !== id),
    );
    return { deleted: true, id };
  }
}
