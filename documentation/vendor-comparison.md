# Vendor comparison

The top-level workspace tabs are **Overview** and **Trade Comparison Sheet**. Overview shows finalised vendors and totals. Trade Comparison Sheet contains the horizontally scrolling trade tabs and the selected trade's comparison table. Switching between the top-level tabs retains the selected trade and unsaved edits. Clicking a trade in Overview opens it under Trade Comparison Sheet.

Selecting a project in a new workspace first checks its saved comparisons. If one exists, the workspace opens that comparison and fetches its complete saved data. A new sheet can be saved only after a successful check finds no existing comparison. Lookup failures offer retry and block creation. Saved sheet names and project links cannot be changed. Backend creation locks the project row and checks for an existing comparison inside the same transaction, preventing simultaneous duplicate creates. A conflict returns the existing comparison ID so the frontend opens it. Historical duplicate sheets are retained; project lookup opens the most recently updated sheet.

The shared trade catalogue lives in the `vendor_trades` database table. Its seed migration inserts the workbook's 26 unique trade names in workbook order; numbered copies of Civil Works, False Ceiling, Metal Work and Painting Labour are collapsed to their base names. New sheets load their trades from `GET /vendor-trades`, including user-created catalogue entries. The frontend has no hardcoded trade list or fallback. Catalogue-load failures show a retry action before opening a new sheet.

Users can create a trade inside the comparison workspace using **Create trade**, which saves it through `POST /vendor-trades`, adds it to the current sheet and opens its tab. New snapshot trades retain the catalogue record IDs. Names are fixed once selected. Users can remove a trade from a sheet or add an existing catalogue trade; removing it does not delete the shared record. Removed trades stay removed after saving. Existing sheets keep their saved trades and quotes.

Catalogue names are unique after normalizing whitespace, case and numbered-copy suffixes. A unique database constraint also prevents concurrent duplicate creates. Listing uses the existing `vendor-rate-comparisons:read` permission; creating requires `vendor-rate-comparisons:create`.

Vendor comparisons belong to a project and no longer require a BOQ. The workspace uses the shared INOS page, form, card, tab and table components. Overview is the default tab and contains the finalised-vendor summary. Selecting a trade opens one comparison table: S.No, Item Description and Qty are shared, followed by a Rate/Amount pair for each vendor. Users choose one to four vendor columns (three by default), select directory or custom vendors in the grouped headers, and finalise a complete quote. Vendor notes appear below the totals in the same table. Quantities can be blank for lump sums; an explicit zero quantity produces zero amount. Negative rates represent discounts. Amounts and totals are calculated from the quote lines.

Shared scope is stored in each trade's `items`; vendor quote lines mirror its IDs, descriptions and quantities with separate rates. Editing the description or quantity updates every vendor column; adding or removing a row affects the whole comparison. The backend rejects mismatched vendor scope. Historical independent quote lines are aligned by description, quantity and occurrence without losing rates, notes or totals. Different historical scopes remain distinct rows with blank rates for vendors that did not quote them; complete the missing rates before finalising those quotes. The existing template-based Excel export continues to fill the vendor tables from the saved quote data.

Only complete quotes can be finalised. The summary lists each trade's finalised vendor and amount, with a total and pending-trade count. Lowest indicators compare complete quotes within the same trade. Excel export fills the supplied `VENDOR COMPARISON 2.xlsx` template, preserving its fonts, fills, borders, column widths and summary structure. The BOQ table is removed, the three vendor tables move left, formulas and dropdowns reference the moved tables, and vendor notes appear below their tables.

Existing schema-version-1 comparisons remain readable. The frontend converts their saved vendor quotes to editable trade quotes without fetching the original BOQ. Saving writes schema version 2. Historical BOQ links remain in the database for traceability; new comparisons have no BOQ link. Revision checks still reject stale or racing saves.

Directory vendors can create or update procurement quotations from their finalised trades. Custom vendor names are supported for comparison; create a directory vendor and use it in the trade when a quotation is required. Discount lines are preserved when creating and editing quotations.

## Deployment

Apply `backend/migrations/20261116_vendor_comparison_without_boq.sql` and `backend/migrations/20261116_vendor_trades.sql` before deploying the backend and frontend together. The first makes the existing BOQ foreign-key column nullable without deleting saved data. The second creates and seeds the shared catalogue, preserving existing records when rerun. The Mac update script includes both through its `20261116_*.sql` pattern. These migrations have not been applied to a live database as part of this code change.

## Verification

- Backend: focused vendor trade catalogue, comparison and procurement quotation Jest suites.
- Frontend: `node --test src/pages/boq/vendorComparisonData.test.js`.
- Pages: `node scripts/check-rate-comparison.mjs` (renders saved historical quotes and the new workspace).
- Production frontend build and backend production TypeScript check.
