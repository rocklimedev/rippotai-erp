# API Layer (`src/api/`)

One file per backend module, each an RTK Query `createApi()` instance. Files map cleanly onto backend modules:

| Frontend file            | Backend module             | Notable hooks                                                                                                                                                                                                                                                                                                                       |
| ------------------------ | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `auth.api.js`            | Auth                       | `useLoginMutation`, `useLogoutMutation`, `useMeQuery`, plus token/verification-token CRUD                                                                                                                                                                                                                                           |
| `rbac.api.js`            | RBAC                       | roles/permissions CRUD, `useBulkAssignPermissionsMutation`, `useGrantPermissionToRoleMutation`                                                                                                                                                                                                                                      |
| `quotation.api.js`       | Quotations                 | full lifecycle: create/update/submit/approve/return/decline/cancel/restore/soft-delete/permanent-delete + items + versions                                                                                                                                                                                                          |
| `project.api.js`         | Projects                   | CRUD + `useArchiveProjectMutation` / `useRestoreProjectMutation`                                                                                                                                                                                                                                                                    |
| `vendor.api.js`          | Vendors                    | CRUD, `useSetVendorStatusMutation`, `useGetQuotationsByVendorQuery`, categories/business-types lookups                                                                                                                                                                                                                              |
| `user.api.js`            | Users                      | CRUD + `useDeactivateUserMutation`                                                                                                                                                                                                                                                                                                  |
| `user-signatures.api.js` | Users (signatures)         | `useGetSignatureQuery`, `useUploadSignatureMutation`, `useDeleteSignatureMutation`                                                                                                                                                                                                                                                  |
| `notification.api.js`    | Engagement (notifications) | list, create, mark read/read-all, delete                                                                                                                                                                                                                                                                                            |
| `activity-logs.api.js`   | Engagement (activity logs) | create, list                                                                                                                                                                                                                                                                                                                        |
| `reports.api.js`         | Reports                    | overview, by-project, by-vendor, by-status, **by-employee** (⚠️ calls `GET /reports/by-employee`, marked "Admin only" in a code comment — but `reports.controller.ts` on the backend currently only defines `overview`/`by-project`/`by-vendor`/`by-status`. This call will 404 until the backend route is added; flag to the team) |
| `settings.api.js`        | Settings                   | CRUD + `useUpsertSettingMutation`                                                                                                                                                                                                                                                                                                   |
| `unit.api.js`            | Metas (units)              | standard CRUD                                                                                                                                                                                                                                                                                                                       |

## Shared conventions (every `*.api.js` file)

```js
const baseQuery = fetchBaseQuery({
  baseUrl: API_URL, // from lib/config.js
  credentials: "include",
  prepareHeaders: (headers) => {
    const token = localStorage.getItem("token");
    if (token) headers.set("Authorization", `Bearer ${token}`);
    const cdnToken = import.meta.env.VITE_CDN_TOKEN;
    if (cdnToken) headers.set("x-cdn-secret", cdnToken);
    return headers;
  },
});
```

- Auth header is attached automatically on **every** request across every API slice, from `localStorage.token` — not from Redux state.
- The CDN secret header is also attached globally, not just on signature endpoints — harmless since the backend only checks it on `CdnGuard`-protected routes.
- Each slice declares its own `tagTypes` and uses `providesTags`/`invalidatesTags` for cache invalidation (see `state-management.md`).
- Query params on list endpoints are built manually with `URLSearchParams` rather than relying on RTK Query's object-to-querystring helpers (e.g. `getQuotations({ status, project_id, vendor_id, includeDeleted })`).

## Adding a new endpoint

1. Add the method to `builder.mutation`/`builder.query` in the relevant `*.api.js` file, matching the backend route exactly (path + verb).
2. Export the generated hook from the same file.
3. Register appropriate `tagTypes`/`providesTags`/`invalidatesTags` so dependent views refetch correctly.
4. If it's a new domain entirely, also add the slice's `reducerPath`/`reducer`/`middleware` to `store/index.js`.
