# Projects Module

Projects are the top-level container quotations are issued against (an architecture/construction project).

Base path: `/api/v1/projects`

## Endpoints

| Method | Endpoint | Handler | Guard |
|---|---|---|---|
| POST | `/api/v1/projects` | `create` | JwtAuthGuard |
| GET | `/api/v1/projects` | `findAll` | JwtAuthGuard |
| GET | `/api/v1/projects/:id` | `findOne` | — |
| PATCH | `/api/v1/projects/:id` | `update` | — |
| DELETE | `/api/v1/projects/:id` | `remove` | — |
| PATCH | `/api/v1/projects/:id/archive` | `archive` | — |
| PATCH | `/api/v1/projects/:id/restore` | `restore` | — |

- `create` / `findAll` require `JwtAuthGuard`.
- `archive` / `restore` toggle a soft-hidden state distinct from delete (see `ProjectStatus` below) — used to hide completed/shelved projects from active lists without losing history.

## Data models

#### `Project` (table: `projects`, paranoid/soft-delete)

| Column | DB field | Type | Null | Default | Notes |
|---|---|---|---|---|---|
| `id` | `id` | DataType.UUIDV4 | no | — | PK |
| `name` | `name` | DataType.STRING(255) | no | — | — |
| `site_location` | `site_location` | DataType.STRING(255) | no | — | — |
| `description` | `description` | DataType.TEXT | yes | — | — |
| `status` | `status` | DataType.ENUM(...Object.values(ProjectStatus) | no | ProjectStatus.ACTIVE | — |
| `quotation_count` | `quotation_count` | DataType.INTEGER | no | 0 | — |
| `approved_value` | `approved_value` | DataType.DECIMAL(15, 2) | no | 0.0 | — |
| `created_by` | `created_by` | DataType.CHAR(36) | yes | — | FK |
| `updated_by` | `updated_by` | DataType.CHAR(36) | yes | — | FK |
| `archived_at` | `archived_at` | DataType.DATE | yes | — | — |
| `archived_by` | `archived_by` | DataType.CHAR(36) | yes | — | FK |
| `deleted_by` | `deleted_by` | DataType.CHAR(36) | yes | — | FK |

**Relations**

| Relation | Type | Target |
|---|---|---|
| `creator` | BelongsTo | `User` |
| `updater` | BelongsTo | `User` |
| `archiver` | BelongsTo | `User` |
| `quotations` | HasMany | `Quotation` |


## Enums

- `ProjectStatus`: `active`, `completed`, `on_hold`, `inactive`
