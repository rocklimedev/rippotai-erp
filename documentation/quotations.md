# Quotations Module

The core domain of this app: vendor quotations against a project, their line items, and full version history.

Base path: `/api/v1/quotations`

## Endpoints

### Quotations

| Method | Endpoint | Handler | Guard |
|---|---|---|---|
| POST | `/api/v1/quotations` | `create` | JwtAuthGuard |
| GET | `/api/v1/quotations` | `findAll` | JwtAuthGuard |
| GET | `/api/v1/quotations/:id` | `findOne` | — |
| PATCH | `/api/v1/quotations/:id` | `update` | — |
| DELETE | `/api/v1/quotations/:id` | `softDelete` | — |
| PATCH | `/api/v1/quotations/:id/approve` | `approve` | — |
| PATCH | `/api/v1/quotations/:id/cancel` | `cancel` | — |
| PATCH | `/api/v1/quotations/:id/decline` | `decline` | — |
| DELETE | `/api/v1/quotations/:id/permanent` | `remove` | — |
| PATCH | `/api/v1/quotations/:id/restore` | `restore` | — |
| PATCH | `/api/v1/quotations/:id/return` | `returnForEditing` | — |
| PATCH | `/api/v1/quotations/:id/submit` | `submit` | — |

### Quotation items (nested under a quotation)

| Method | Endpoint | Handler | Guard |
|---|---|---|---|
| POST | `/api/v1/quotations/:quotationId/items` | `create` | — |
| GET | `/api/v1/quotations/:quotationId/items` | `findAll` | — |
| PUT | `/api/v1/quotations/:quotationId/items` | `replaceAll` | — |
| PATCH | `/api/v1/quotations/:quotationId/items/:itemId` | `update` | — |
| DELETE | `/api/v1/quotations/:quotationId/items/:itemId` | `remove` | — |

### Quotation versions (snapshots)

| Method | Endpoint | Handler | Guard |
|---|---|---|---|
| GET | `/api/v1/quotations/:quotationId/versions` | `list` | — |
| POST | `/api/v1/quotations/:quotationId/versions` | `create` | — |
| GET | `/api/v1/quotations/versions/:id` | `get` | — |
| DELETE | `/api/v1/quotations/versions/:id` | `delete` | — |
| POST | `/api/v1/quotations/versions/:id/restore` | `restore` | — |

## Status lifecycle (`QuotationStatus`)

```
draft → submitted → approved
              ↓          
        returned_for_editing → (back to draft/submitted)
              ↓
          declined

any non-terminal state → cancelled
```

Corresponding endpoints: `PATCH /:id/submit`, `/approve`, `/return`, `/decline`, `/cancel`, and `/restore` (undo a soft-delete). Deletion is **soft** by default (`DELETE /:id` sets `deleted_at`, model is `paranoid`); `DELETE /:id/permanent` hard-deletes.

## Snapshots

Each `Quotation` stores a denormalized `project_snapshot` and `vendor_snapshot` (JSON columns) captured at creation time — so a quotation's PDF/history stays accurate even if the source Project or Vendor record is later edited.

## Versions

`quotation_versions` lets a user snapshot the current quotation + items into a numbered version (`current_version` on the parent row) with an optional `remarks` note, and later restore an old version back onto the live quotation. This is the audit-trail / "track changes" mechanism for quotations going through review cycles.

## Discounts & totals

Quotation totals are **server-computed and stored**, not derived on the fly: `subtotal`, `additional_charges`, `discount`, `global_discount_type` (`fixed` or `percentage`) + `global_discount_value`, `tax_percent`, `tax_amount`, `total_amount` are all persisted columns on the `Quotation` row.

## Data models

#### `QuotationItem` (table: `quotation_items`)

| Column | DB field | Type | Null | Default | Notes |
|---|---|---|---|---|---|
| `id` | `id` | DataType.UUIDV4 | no | — | PK |
| `quotation_id` | `quotation_id` | DataType.CHAR(36) | no | — | FK |
| `unit_id` | `unit_id` | DataType.CHAR(36) | yes | — | FK |
| `sno` | `sno` | DataType.SMALLINT | no | — | — |
| `particular` | `particular` | DataType.TEXT | no | — | — |
| `rate` | `rate` | DataType.DECIMAL(12, 2) | no | 0.0 | — |
| `quantity` | `quantity` | DataType.DECIMAL(10, 3) | no | 0.0 | — |
| `amount` | `amount` | DataType.DECIMAL(15, 2) | no | 0.0 | — |
| `remarks` | `remarks` | DataType.TEXT | yes | — | — |

**Relations**

| Relation | Type | Target |
|---|---|---|
| `quotation` | BelongsTo | `Quotation` |
| `unit` | BelongsTo | `Unit` |

#### `QuotationVersion` (table: `quotation_versions`)

| Column | DB field | Type | Null | Default | Notes |
|---|---|---|---|---|---|
| `id` | `id` | DataType.UUIDV4 | no | — | PK |
| `quotationId` | `quotation_id` | DataType.UUID | no | — | FK |
| `version` | `version` | DataType.INTEGER | no | — | — |
| `snapshot` | `snapshot` | DataType.JSON | no | — | — |
| `remarks` | `remarks` | DataType.TEXT | yes | — | — |
| `createdBy` | `created_by` | DataType.UUID | yes | — | FK |

**Relations**

| Relation | Type | Target |
|---|---|---|
| `quotation` | BelongsTo | `Quotation` |
| `creator` | BelongsTo | `User` |

#### `Quotation` (table: `quotations`, paranoid/soft-delete)

| Column | DB field | Type | Null | Default | Notes |
|---|---|---|---|---|---|
| `id` | `id` | DataType.UUIDV4 | no | — | PK |
| `quotationNumber` | `quotation_number` | string | no | — | unique |
| `quotationDate` | `quotation_date` | DataType.DATEONLY | no | — | — |
| `status` | `status` | DataType.ENUM(...Object.values(QuotationStatus) | no | QuotationStatus.DRAFT | — |
| `projectId` | `project_id` | DataType.UUID | no | — | FK |
| `vendorId` | `vendor_id` | DataType.UUID | no | — | FK |
| `projectSnapshot` | `project_snapshot` | DataType.JSON | no | — | — |
| `vendorSnapshot` | `vendor_snapshot` | DataType.JSON | no | — | — |
| `subtotal` | `subtotal` | DataType.DECIMAL(15, 2) | no | 0 | — |
| `additionalCharges` | `additional_charges` | DataType.DECIMAL(15, 2) | no | 0 | — |
| `globalDiscountType` | `global_discount_type` | DataType.ENUM(...Object.values(GlobalDiscountType) | no | GlobalDiscountType.FIXED | — |
| `globalDiscountValue` | `global_discount_value` | DataType.DECIMAL(15, 2) | no | 0 | — |
| `discount` | `discount` | DataType.DECIMAL(15, 2) | no | 0 | — |
| `taxPercent` | `tax_percent` | DataType.DECIMAL(5, 2) | no | 0 | — |
| `taxAmount` | `tax_amount` | DataType.DECIMAL(15, 2) | no | 0 | — |
| `totalAmount` | `total_amount` | DataType.DECIMAL(15, 2) | no | 0 | — |
| `termsConditions` | `terms_conditions` | DataType.TEXT | yes | — | — |
| `submittedAt` | `submitted_at` | DataType.DATE | yes | — | — |
| `submittedBy` | `submitted_by` | DataType.UUID | yes | — | FK |
| `reviewedAt` | `reviewed_at` | DataType.DATE | yes | — | — |
| `reviewedBy` | `reviewed_by` | DataType.UUID | yes | — | FK |
| `reviewRemarks` | `review_remarks` | DataType.TEXT | yes | — | — |
| `deletedAt` | `deleted_at` | DataType.DATE | yes | — | — |
| `deletedBy` | `deleted_by` | DataType.UUID | yes | — | FK |
| `createdBy` | `created_by` | DataType.UUID | yes | — | FK |
| `updatedBy` | `updated_by` | DataType.UUID | yes | — | FK |
| `currentVersion` | `current_version` | DataType.INTEGER | no | 1 | — |

**Relations**

| Relation | Type | Target |
|---|---|---|
| `versions` | HasMany | `QuotationVersion` |
| `project` | BelongsTo | `Project` |
| `vendor` | BelongsTo | `Vendor` |
| `submitter` | BelongsTo | `User` |
| `reviewer` | BelongsTo | `User` |
| `deleter` | BelongsTo | `User` |
| `creator` | BelongsTo | `User` |
| `updater` | BelongsTo | `User` |
| `items` | HasMany | `QuotationItem` |


## Enums

- `QuotationStatus`: `draft`, `submitted`, `approved`, `returned_for_editing`, `declined`, `cancelled`
- `GlobalDiscountType`: `fixed`, `percentage`
