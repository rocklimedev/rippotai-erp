# Users Module

User accounts and their uploaded signature images (used on approved quotations/PDFs).

Base paths: `/api/v1/users`, `/api/v1/user-signatures`

## Endpoints

| Method | Endpoint | Handler | Guard |
|---|---|---|---|
| GET | `/api/v1/user-signatures/:userId` | `getSignature` | — |
| DELETE | `/api/v1/user-signatures/:userId` | `deleteSignature` | CdnGuard |
| POST | `/api/v1/users` | `create` | — |
| GET | `/api/v1/users` | `findAll` | — |
| GET | `/api/v1/users/:id` | `findOne` | — |
| PATCH | `/api/v1/users/:id` | `update` | — |
| DELETE | `/api/v1/users/:id` | `remove` | — |
| PATCH | `/api/v1/users/:id/deactivate` | `deactivate` | — |

- `user-signatures` is guarded by a **`CdnGuard`** on delete — signatures are stored/served via the CDN integration (see `common.md`), not as plain local uploads.
- `PATCH /users/:id/deactivate` — soft-disables a user without deleting the row (keeps FK history on quotations/projects intact).

## Data models

#### `UserSignature` (table: `user_signatures`)

| Column | DB field | Type | Null | Default | Notes |
|---|---|---|---|---|---|
| `id` | `id` | DataType.UUIDV4 | no | — | PK |
| `user_id` | `user_id` | DataType.CHAR(36) | no | — | FK |
| `signature_url` | `signature_url` | DataType.STRING(500) | yes | — | — |
| `signature_file_name` | `signature_file_name` | DataType.STRING(255) | yes | — | — |
| `signature_file_type` | `signature_file_type` | DataType.STRING(100) | yes | — | — |
| `signature_file_size` | `signature_file_size` | DataType.BIGINT | yes | — | — |
| `is_active` | `is_active` | DataType.TINYINT | no | true | — |
| `created_by` | `created_by` | DataType.CHAR(36) | yes | — | FK |
| `created_at` | `created_at` | Date | no | — | — |
| `updated_at` | `updated_at` | Date | no | — | — |

**Relations**

| Relation | Type | Target |
|---|---|---|
| `user` | BelongsTo | `User` |
| `createdByUser` | BelongsTo | `User` |

#### `User` (table: `users`)

| Column | DB field | Type | Null | Default | Notes |
|---|---|---|---|---|---|
| `id` | `id` | DataType.UUIDV4 | no | — | PK |
| `name` | `name` | DataType.STRING(255) | no | — | — |
| `email` | `email` | DataType.STRING(255) | no | — | unique |
| `password_hash` | `password_hash` | DataType.STRING(255) | no | — | — |
| `role_id` | `role_id` | DataType.CHAR(36) | yes | — | FK |
| `is_active` | `is_active` | DataType.BOOLEAN | no | true | — |
| `last_login_at` | `last_login_at` | DataType.DATE | yes | — | — |
| `created_by` | `created_by` | DataType.CHAR(36) | yes | — | FK |

**Relations**

| Relation | Type | Target |
|---|---|---|
| `role` | BelongsTo | `Role` |
| `creator` | BelongsTo | `User` |

