# Metas Module (Units)

Small reference-data module: units of measurement used on quotation line items (e.g. `kg`, `pcs`, `sqft`).

Base path: `/api/v1/units`

## Endpoints

| Method | Endpoint | Handler | Guard |
|---|---|---|---|
| POST | `/api/v1/units` | `create` | — |
| GET | `/api/v1/units` | `findAll` | — |
| GET | `/api/v1/units/:id` | `findOne` | — |
| PATCH | `/api/v1/units/:id` | `update` | — |
| DELETE | `/api/v1/units/:id` | `remove` | — |

Straightforward CRUD — no special guard or workflow logic found.

## Data models

#### `Unit` (table: `units`)

| Column | DB field | Type | Null | Default | Notes |
|---|---|---|---|---|---|
| `id` | `id` | DataType.UUIDV4 | no | — | PK |
| `name` | `name` | DataType.STRING(50) | no | — | — |
| `code` | `code` | DataType.STRING(20) | no | — | unique |
| `description` | `description` | DataType.STRING(255) | yes | — | — |
| `is_active` | `is_active` | DataType.BOOLEAN | no | — | — |
| `createdAt` | `createdAt` | Date | no | — | — |
| `updatedAt` | `updatedAt` | Date | no | — | — |

**Relations**

_None declared._

