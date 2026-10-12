# Non-admin role permission baselines

Review owner: ERP role owners / backend security maintainers
Last reviewed: 2026-10-10

Apply `backend/migrations/20261010_non_admin_role_permissions.sql` after the permission catalogue migration. ADMIN and SUPERADMIN are excluded because their grants are already completed. This migration is additive and rerunnable, and matches each supplied UUID, exact role name and scope. It does not revoke existing grants. USER and CLIENT deliberately receive no staff permissions; their account/client access is handled by the existing scoped flows.

These are conservative baseline assignments inferred from the supplied descriptions: junior designers author drawings/documents; senior designers also author plans and BOQs; site roles author inspection/execution reports; leads coordinate projects and client delivery; principal architects additionally approve architectural work. Financial/procurement approvals, RBAC management, cross-user sessions, integrations, reindex and system configuration are excluded from all these profiles. DEVELOPER has diagnostics only. Business-record deletion is excluded except task deletion by leads.

PROJECT roles remain separate IDs from INTERNAL roles. Permission grants do not enforce project membership or entity ownership, and assigning a PROJECT role to a user as their global role does not restrict these capabilities to a project. Preserve existing project-scoping checks when assigning roles. Missing/mismatched roles are skipped by SQL; verify that the final report contains all 13 supplied non-admin roles. No database execution was performed.

Regenerate or check with `node scripts/role-permission-profiles.cjs` / `node scripts/role-permission-profiles.cjs --check`. Profiles contain explicit capability lists; future catalogue additions receive no grants automatically.

| Role | Scope | Capabilities | Baseline |
| --- | --- | --- | --- |
| USER | INTERNAL | 0 | Account self-service only; no staff grants |
| SENIOR_ARCHITECT | INTERNAL | 109 | Design authoring, planning and BOQ submission; no approvals |
| JUNIOR_ARCHITECT | INTERNAL | 75 | Design reads and document/drawing authoring |
| SENIOR_INTERIOR_DESIGNER | INTERNAL | 109 | Interior design authoring, planning and BOQ submission; no approvals |
| JUNIOR_INTERIOR_DESIGNER | INTERNAL | 75 | Interior design reads and document/drawing authoring |
| SITE_SUPERVISOR | INTERNAL | 102 | Site execution and reporting; no financial approvals or QC sign-off |
| CLIENT | INTERNAL | 0 | Client home and client-token flows only; no staff grants |
| PRINCIPAL_ARCHITECT | INTERNAL | 169 | Architectural oversight and architectural approvals; no procurement/payment approvals |
| PROJECT_LEAD | INTERNAL | 163 | Project coordination, planning and client delivery; no financial approvals |
| DEVELOPER | INTERNAL | 9 | Limited system diagnostics; no business data mutation or administration |
| SITE_ENGINEER | INTERNAL | 102 | Site inspections, recce, measurements and reporting; no approvals |
| Project Lead | PROJECT | 163 | Project coordination capabilities; project membership remains a separate policy |
| ARCHITECT | PROJECT | 75 | Project design authoring; project membership remains a separate policy |
