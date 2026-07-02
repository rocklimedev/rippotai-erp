# Vendors Module

Vendor directory (the "suppliers/contractors" ERP quotes go out to), plus reference data: business types and categories.

Base paths: `/api/v1/vendors`, `/api/v1/vendor/categories`, `/api/v1/vendor/business-types`

## Endpoints

| Method | Endpoint | Handler | Guard |
|---|---|---|---|
| GET | `/api/v1/vendor/business-types` | `findAll` | — |
| GET | `/api/v1/vendor/business-types/:id` | `findOne` | — |
| GET | `/api/v1/vendor/categories` | `findAll` | — |
| GET | `/api/v1/vendor/categories/:id` | `findOne` | — |
| POST | `/api/v1/vendors` | `create` | JwtAuthGuard |
| GET | `/api/v1/vendors` | `findAll` | JwtAuthGuard |
| GET | `/api/v1/vendors/:id` | `findOne` | — |
| PATCH | `/api/v1/vendors/:id` | `update` | — |
| DELETE | `/api/v1/vendors/:id` | `remove` | — |
| GET | `/api/v1/vendors/:id/quotations` | `getQuotations` | — |
| PATCH | `/api/v1/vendors/:id/status` | `setStatus` | — |

- `create` / `findAll` on `/vendors` require `JwtAuthGuard`; detail/update/status/quotations sub-routes currently don't declare a guard at the controller level shown by static analysis — verify before treating as public.
- `GET /vendors/:id/quotations` returns all quotations issued to that vendor (cross-module lookup into the Quotations module).
- `PATCH /vendors/:id/status` transitions a vendor between `VendorStatus` values (see enum below) — e.g. blacklisting a vendor.
- `vendor/categories` and `vendor/business-types` are **read-only reference endpoints** (only `findAll`/`findOne`) — they map to the fixed `VendorCategory` and `VendorBusinessType` enums rather than being freely user-editable tables.

## Data models

#### `VendorBusinessType` (table: `vendor_business_types`)

| Column | DB field | Type | Null | Default | Notes |
|---|---|---|---|---|---|
| `id` | `id` | DataType.UUIDV4 | no | — | PK |
| `category_id` | `category_id` | DataType.CHAR(36) | no | — | FK |
| `name` | `name` | DataType.STRING(150) | no | — | — |
| `status` | `status` | DataType.BOOLEAN | no | true | — |

**Relations**

| Relation | Type | Target |
|---|---|---|
| `category` | BelongsTo | `VendorCategory` |
| `vendors` | HasMany | `Vendor` |

#### `VendorCategory` (table: `vendor_categories`)

| Column | DB field | Type | Null | Default | Notes |
|---|---|---|---|---|---|
| `id` | `id` | DataType.UUIDV4 | no | — | PK |
| `name` | `name` | DataType.STRING(100) | no | — | unique |
| `status` | `status` | DataType.BOOLEAN | no | true | — |

**Relations**

| Relation | Type | Target |
|---|---|---|
| `businessTypes` | HasMany | `VendorBusinessType` |
| `vendors` | HasMany | `Vendor` |

#### `Vendor` (table: `vendors`)

| Column | DB field | Type | Null | Default | Notes |
|---|---|---|---|---|---|
| `id` | `id` | DataType.UUIDV4 | no | — | PK |
| `name` | `name` | DataType.STRING(255) | no | — | — |
| `company_name` | `company_name` | DataType.STRING(255) | yes | — | — |
| `position` | `position` | DataType.STRING(100) | yes | — | — |
| `vendor_category_id` | `vendor_category_id` | DataType.CHAR(36) | yes | — | FK |
| `business_type_id` | `business_type_id` | DataType.CHAR(36) | yes | — | FK |
| `contact_number` | `contact_number` | DataType.STRING(20) | no | — | — |
| `alternate_contact` | `alternate_contact` | DataType.STRING(20) | yes | — | — |
| `address` | `address` | DataType.TEXT | yes | — | — |
| `notes` | `notes` | DataType.TEXT | yes | — | — |
| `status` | `status` | DataType.ENUM(...Object.values(VendorStatus) | no | VendorStatus.ACTIVE | — |
| `created_by` | `created_by` | DataType.CHAR(36) | yes | — | FK |
| `updated_by` | `updated_by` | DataType.CHAR(36) | yes | — | FK |

**Relations**

| Relation | Type | Target |
|---|---|---|
| `vendorCategory` | BelongsTo | `VendorCategory` |
| `businessType` | BelongsTo | `VendorBusinessType` |
| `creator` | BelongsTo | `User` |
| `updater` | BelongsTo | `User` |
| `quotations` | HasMany | `Quotation` |


## Enums (from `common/enums`)

- `VendorStatus`: `active`, `inactive`, `blacklisted`, `blocked`
- `VendorCategory`: `Material`, `Contractor`
- `VendorBusinessType`: a fixed trade list — Paint, Wiring, Glass, Metal, Tiles, Cement, Sand, Steel, Wood, Flooring, Plumbing Materials, Electrical Materials, Hardware, Labour, Labour Contractor, Civil Contractor, Electrician, Plumbing Contractor, Painter, Polishing, AC Work, Interior Contractor, Carpenter, Mason, Material Contractor
