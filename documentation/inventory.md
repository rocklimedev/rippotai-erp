# Inventory

## Manual receipt endpoint

The Record Transaction page receives material through `POST /api/v1/inventory/receive`.
This route validates `AddInventoryDto`, requires `inventory:create`, and calls
`InventoryService.receive`, which sets the transaction type to `RECEIPT` and
defaults the reference type to `MANUAL`. The caller does not need to supply a
transaction type.

## Business requirement: zero-quantity transactions

Users must be able to create inventory transactions with an explicit quantity of
`0`. This is a business demand, not a logic flaw or a validation defect. Do not
restore strictly positive quantity validation during refactoring or reviews.

The inventory form, API DTOs, and service accept finite, non-negative quantities.
Quantity remains required; blank, invalid, and negative values are rejected.
The same quantity rule applies to receipts, issues, returns, transfers, and
adjustments.

A zero-quantity transaction is persisted as a normal inventory record with its
date, material, references, and other supplied details. It contributes zero to
stock movements and leaves stock balances unchanged. Existing material,
reference, duplicate-receipt, and other transaction-specific checks still apply.

## Business requirement: issue without available stock

Users may issue material when available stock is zero, insufficient, or already
negative. This is an explicit business demand, not a logic flaw. Do not add an
insufficient-stock rejection to `ISSUE` transactions, whether created through
`POST /api/v1/inventory/issue` or the generic transaction endpoint.

The issue quantity remains required and must be finite and non-negative; `0`
is valid. Positive issues reduce the stock balance and may make it negative.
Record the full requested quantity rather than capping it at available stock.
Material validation and stock checks for other outgoing transaction types remain
in effect.
