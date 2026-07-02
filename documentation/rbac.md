# RBAC Module

Role-based access control: roles, permissions, and the many-to-many mapping between them.

Base paths: `/api/v1/rbac` (roles), `/api/v1/permissions`, `/api/v1/role-permissions`

> Note: the roles controller is mounted at `rbac` rather than `roles` — worth an alias/rename if this ever becomes a public API surface.

## Endpoints

| Method | Endpoint | Handler | Guard |
|---|---|---|---|
| POST | `/api/v1/permissions` | `create` | — |
| GET | `/api/v1/permissions` | `findAll` | — |
| GET | `/api/v1/permissions/:id` | `findOne` | — |
| PATCH | `/api/v1/permissions/:id` | `update` | — |
| DELETE | `/api/v1/permissions/:id` | `remove` | — |
| POST | `/api/v1/rbac` | `create` | — |
| GET | `/api/v1/rbac` | `findAll` | — |
| GET | `/api/v1/rbac/:id` | `findOne` | — |
| PATCH | `/api/v1/rbac/:id` | `update` | — |
| DELETE | `/api/v1/rbac/:id` | `remove` | — |
| POST | `/api/v1/role-permissions` | `grant` | — |
| GET | `/api/v1/role-permissions` | `findAll` | — |
| DELETE | `/api/v1/role-permissions/:role_id/:permission_id` | `revoke` | — |
| POST | `/api/v1/role-permissions/bulk` | `bulkAssign` | — |

- `POST /role-permissions` grants a single permission to a role.
- `POST /role-permissions/bulk` grants many permissions to a role in one call (used by the Settings UI's role editor).
- `DELETE /role-permissions/:role_id/:permission_id` revokes one permission from one role.

## Data models

#### `Permission` (table: `permissions`)

| Column | DB field | Type | Null | Default | Notes |
|---|---|---|---|---|---|
| `id` | `id` | DataType.UUIDV4 | no | — | PK |
| `name` | `name` | DataType.STRING(100) | no | — | unique |
| `resource` | `resource` | DataType.STRING(50) | no | — | — |
| `action` | `action` | DataType.STRING(50) | no | — | — |
| `description` | `description` | DataType.TEXT | yes | — | — |

**Relations**

_None declared._

#### `Role` (table: `roles`)

| Column | DB field | Type | Null | Default | Notes |
|---|---|---|---|---|---|
| `id` | `id` | DataType.UUIDV4 | no | — | PK |
| `name` | `name` | DataType.STRING(50) | no | — | unique |
| `description` | `description` | DataType.TEXT | yes | — | — |

**Relations**

| Relation | Type | Target |
|---|---|---|
| `users` | HasMany | `User` |

#### `RolePermission` (table: `role_permissions`)

| Column | DB field | Type | Null | Default | Notes |
|---|---|---|---|---|---|
| `role_id` | `role_id` | DataType.CHAR(36) | no | — | FK |
| `permission_id` | `permission_id` | DataType.CHAR(36) | no | — | FK |
| `granted_at` | `granted_at` | DataType.DATE | no | DataType.NOW | — |
| `granted_by` | `granted_by` | DataType.CHAR(36) | yes | — | FK |

**Relations**

| Relation | Type | Target |
|---|---|---|
| `role` | BelongsTo | `Role` |
| `permission` | BelongsTo | `Permission` |
| `grantor` | BelongsTo | `User` |


## Known roles referenced elsewhere in the codebase

The frontend's `PrivateRoute` checks `user.role !== "ADMIN"` for `adminOnly` routes (Settings, Activity Logs) — so at minimum an `ADMIN` role is expected to exist in the `roles` table for those pages to be reachable.
