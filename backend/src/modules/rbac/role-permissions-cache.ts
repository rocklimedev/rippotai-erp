import { Injectable, Module } from '@nestjs/common';

export const ROLE_PERMISSION_TTL_MS = 30_000;
const MAX_CACHED_ROLES = 1_000;

@Injectable()
export class RolePermissionsCache {
  private readonly entries = new Map<
    string,
    { expires: number; permissions: string[] }
  >();
  private revision = 0;

  get generation() {
    return this.revision;
  }

  get(roleId?: string | null): string[] | undefined {
    if (!roleId) return undefined;
    const entry = this.entries.get(roleId);
    if (!entry) return undefined;
    if (entry.expires <= Date.now()) {
      this.entries.delete(roleId);
      return undefined;
    }
    return [...entry.permissions];
  }

  set(roleId: string, permissions: string[], generation: number) {
    // A query begun before invalidation must never repopulate stale grants.
    if (generation !== this.revision) return;
    if (this.entries.size >= MAX_CACHED_ROLES) {
      this.entries.delete(this.entries.keys().next().value!);
    }
    this.entries.set(roleId, {
      expires: Date.now() + ROLE_PERMISSION_TTL_MS,
      permissions: [...new Set(permissions)],
    });
  }

  invalidate(roleId: string) {
    this.revision++;
    this.entries.delete(roleId);
  }

  clear() {
    this.revision++;
    this.entries.clear();
  }
}

@Module({ providers: [RolePermissionsCache], exports: [RolePermissionsCache] })
export class RolePermissionsCacheModule {}
