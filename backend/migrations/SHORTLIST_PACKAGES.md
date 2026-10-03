Apply `20261003_shortlist_packages.sql` to the configured MySQL database before deploying the backend. Sequelize schema synchronization is disabled. The migration adds one table and does not modify existing shortlist data. It has not been run against a live database.

In Procurement → Vendors → Shortlists, select a project and assign vendors/materials. Use **Save package** to snapshot that shortlist. In another project, create the matching VENDOR or MATERIAL shortlist, choose the package and target, preview the matches, then apply.

Vendor trades match active marked project scope categories (name or slug), or marked brief procurement categories, through explicit normalized aliases in `shortlist-package-matching.ts`. Unmarked services are skipped. Material entries require the same material master ID in the target project's material requirements. Empty skeleton rows are filled; populated rows are preserved. Prices, quotations and selection decisions are not reused. Package application runs in a transaction and rechecks matches at apply time. Package APIs require the existing JWT guard.

API: `GET/POST /shortlist-packages`, `DELETE /shortlist-packages/:id`, `POST /shortlist-packages/:id/preview`, and `POST /shortlist-packages/:id/apply`. Create body: `{ "name": "Standard", "source_shortlist_id": "UUID" }`. Preview/apply body: `{ "target_shortlist_id": "UUID" }`.

Validation: `npm run build` in backend and frontend; `npx jest --config test/shortlist-jest.json --runInBand` in backend.

Rollback: `DROP TABLE shortlist_packages;` removes saved packages only; already applied shortlist entries remain.
