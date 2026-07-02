# Routing

Router: `react-router-dom`, set up in `src/router/Router.jsx`.

## Shape

```
/login                    public — <Login />
/                          → redirect to /dashboard
/*  (everything else)      wrapped in <PrivateRoute><Layout>...</Layout></PrivateRoute>
```

Every other route is defined declaratively as a **route-config object** (not JSX `<Route>` tags scattered around) and rendered generically inside `Router.jsx`:

```js
{ path, name, isSidebarActive, adminOnly?, element }
```

- `name` / `isSidebarActive` are consumed by the sidebar to build nav links automatically — adding a route to the config is enough to make it (optionally) appear in navigation, no separate sidebar edit needed.
- `adminOnly: true` wraps that specific route in an extra `<PrivateRoute adminOnly>`.

## Route config files (`src/router/routes/*.routes.jsx`)

One file per domain, each exporting an array merged into `masterRoutes` in `routes.js`:

| File | Routes | Sidebar | Admin only |
|---|---|---|---|
| `auth.routes.jsx` | `/login` | no | no |
| `dashboard.routes.jsx` | `/dashboard` | yes | no |
| `quotation.routes.jsx` | `/quotations`, `/quotations/create`, `/quotations/:id/edit`, `/quotations/:id` | yes (list only) | no |
| `project.routes.jsx` | `/projects`, `/projects/:id` | yes (list only) | no |
| `vendor.routes.jsx` | `/vendors`, `/vendors/:id` | yes (list only) | no |
| `report.routes.jsx` | `/reports` | yes | no |
| `activity-logs.routes.jsx` | `/activity-logs` | yes | **yes** |
| `settings.routes.jsx` | `/settings` | yes | **yes** |
| `error.routes.jsx` | `*` → redirect to `/dashboard` | no | no |

Note: `/quotations/create` and `/quotations/:id/edit` both render the same `<CreateQuotation />` component — it's a single form component handling both create and edit modes.

## Auth guarding (`PrivateRoute.jsx`)

```js
const { user, isLoading } = useAuth();
if (isLoading) return <Loading />;
if (!user) return <Navigate to="/login" />;
if (adminOnly && user.role !== "ADMIN") return <Navigate to="/dashboard" />;
return children;
```

`useAuth()` (in `store/use-auth.js`) is backed by RTK Query's `useMeQuery()` — so route protection is really "does `GET /auth/me` currently resolve to a user", not a client-only JWT decode.

## Pages (`src/concepts/`)

| Page | File | Backend module it talks to |
|---|---|---|
| Login | `concepts/auth/Login.jsx` | Auth |
| Dashboard | `concepts/dashboard/Dashboard.jsx` | likely Reports + others (KPI summary) |
| Quotations list | `concepts/quotations/QuotationsList.jsx` | Quotations |
| Create/edit quotation | `concepts/quotations/CreateQuotation.jsx` | Quotations, Quotation Items |
| Quotation detail | `concepts/quotations/QuotationDetail.jsx` | Quotations, Items, Versions |
| Projects list | `concepts/projects/ProjectsList.jsx` | Projects |
| Project detail | `concepts/projects/ProjectDetail.jsx` | Projects, (its quotations) |
| Vendors list | `concepts/vendors/VendorsList.jsx` | Vendors |
| Vendor detail | `concepts/vendors/VendorDetail.jsx` | Vendors (+ its quotations via `GET /vendors/:id/quotations`) |
| Reports | `concepts/reports/Reports.jsx` | Reports |
| Settings | `concepts/settings/Settings.jsx` (admin only) | Settings, RBAC |
| Activity logs | `concepts/activity-logs/ActivityLogs.jsx` (admin only) | Engagement (activity-logs) |
