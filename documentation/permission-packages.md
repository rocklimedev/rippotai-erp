# Reusable role permission packages

In Settings → Roles & permissions, select any role, choose a permission package,
review its description and permission preview, and click **Apply package**.
Packages add permissions without removing existing grants. Applying a package
again is safe. Multiple packages can be combined; individual permissions can
still be granted or revoked afterward. App access remains separately configurable.

Seven explicit packages are included: Junior architect, Senior architect,
Site engineer, Site supervisor, Project lead, Principal architect, and Developer.
These reuse the reviewed non-admin baselines and are independent of role IDs and names.
Packages do not automatically gain permissions when new API routes are added.

API: `GET /role-permissions/packages` requires `role-permissions:read`.
`POST /role-permissions/packages/apply` requires `role-permissions:assign`, with
body `{ "role_id": "<role UUID>", "package_id": "project-lead" }`.
Unknown packages/roles return 404. An incomplete permission catalogue returns
400 with missing capabilities, before any grants are written. Apply the existing
staff permission catalogue migration if capabilities are missing.

Maintain packages in `backend/src/modules/rbac/permission-packages.json`.
Each entry has a stable ID, display name, description, and explicit list of
`resource:action` capabilities. Review changes as access-control policy changes.
Project membership and record visibility remain governed by existing policies.
