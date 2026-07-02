# Components

## Layers

```
components/
├── Layout.jsx          App shell: sidebar + content area, wraps every private route
├── Sidebar.jsx          Nav, built from the route config's isSidebarActive/name fields
├── ui/                  shadcn/ui-style primitives wrapping Radix UI (button, dialog, table, ...)
├── common/               Shared, non-domain components (e.g. ConfirmDialog)
├── notification/         NotificationBell.jsx — bell icon + dropdown, driven by notification.api.js
├── activity-logs/        ActivityDetailsModal.jsx
├── projects/             ProjectFormModal.jsx
└── quotations/           DetailsTab.jsx, PrintableQuotation.jsx, VersionHistoryTab.jsx
```

## `components/ui/` — design system primitives

Standard shadcn/ui set (Radix UI + Tailwind + `class-variance-authority`), ~40 components: `accordion`, `alert(-dialog)`, `avatar`, `badge`, `breadcrumb`, `button`, `calendar`, `card`, `carousel`, `checkbox`, `collapsible`, `command`, `context-menu`, `dialog`, `drawer`, `dropdown-menu`, `form`, `hover-card`, `input(-otp)`, `label`, `menubar`, `navigation-menu`, `pagination`, `popover`, `progress`, `radio-group`, `resizable`, `scroll-area`, `select`, `separator`, `sheet`, `skeleton`, `slider`, `sonner` (toast), `switch`, `table`, `tabs`, `textarea`, `toast(er)`, `toggle(-group)`, `tooltip`.

These are generic, unstyled-to-your-brand-until-themed primitives — treat them as the base layer; don't fork them per-feature, compose them instead.

## Domain feature components

- **`quotations/PrintableQuotation.jsx`** — a print/PDF-oriented layout of a quotation, separate from the interactive `QuotationDetail` page.
- **`quotations/VersionHistoryTab.jsx`** — renders the version list/restore UI backed by `useGetQuotationVersionsQuery` / `useRestoreQuotationVersionMutation`.
- **`quotations/DetailsTab.jsx`** — one tab within the quotation detail view.
- **`projects/ProjectFormModal.jsx`** — shared create/edit modal for projects (used from `ProjectsList`).
- **`notification/NotificationBell.jsx`** — subscribes indirectly to realtime updates via `useNotificationSocket` + `notification.api.js` queries.
- **`activity-logs/ActivityDetailsModal.jsx`** — expands a single activity log entry's detail (likely the JSON diff/payload).
- **`common/ConfirmDialog.jsx`** — generic "are you sure?" dialog, reused for destructive actions (delete/cancel/decline) across modules.

## Styling

Tailwind CSS with `tailwindcss-animate`; class composition via `clsx` + `tailwind-merge` wrapped in the `cn()` helper (`lib/utils.js`) — the standard shadcn pattern (`cn("base-classes", conditional && "extra-classes")`).
