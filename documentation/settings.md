# Settings Module

Simple key/value application settings store.

Base path: `/api/v1/settings`

## Endpoints

| Method | Endpoint | Handler | Guard |
|---|---|---|---|
| POST | `/api/v1/settings` | `create` | — |
| GET | `/api/v1/settings` | `findAll` | — |
| GET | `/api/v1/settings/:key` | `findByKey` | — |
| PATCH | `/api/v1/settings/:key` | `update` | — |
| PUT | `/api/v1/settings/:key` | `upsert` | — |
| DELETE | `/api/v1/settings/:key` | `remove` | — |

- Settings are addressed by a unique `key` string rather than a UUID.
- `PATCH /:key` updates an existing setting; `PUT /:key` **upserts** (creates if missing) — the service explicitly catches Sequelize `UniqueConstraintError` on create and converts it to a `409 Conflict` with a friendly message.

## Data models

#### `Setting` (table: `settings`)

| Column | DB field | Type | Null | Default | Notes |
|---|---|---|---|---|---|
| `id` | `id` | DataType.UUIDV4 | no | — | PK |
| `key` | `key` | DataType.STRING(100) | no | — | unique |
| `value` | `value` | DataType.JSON | no | — | — |
| `updated_by` | `updated_by` | DataType.CHAR(36) | yes | — | FK |

**Relations**

| Relation | Type | Target |
|---|---|---|
| `updater` | BelongsTo | `User` |

