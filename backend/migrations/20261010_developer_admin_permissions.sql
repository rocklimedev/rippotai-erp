-- Replace DEVELOPER grants with the union of current ADMIN/SUPERADMIN grants.
-- Run after the administrator permission migrations. Rerunnable.
-- Only DEVELOPER role_permissions rows are changed; role names stay unchanged.
-- Missing/mismatched roles or either empty administrator grant set cause a no-op.
-- Administrator-only role checks still require ADMIN/SUPERADMIN at runtime.

DROP TEMPORARY TABLE IF EXISTS developer_admin_permission_snapshot;
CREATE TEMPORARY TABLE developer_admin_permission_snapshot (
  permission_id CHAR(36) NOT NULL PRIMARY KEY
);

START TRANSACTION;

INSERT INTO developer_admin_permission_snapshot (permission_id)
SELECT DISTINCT rp.permission_id
FROM role_permissions rp
WHERE rp.role_id IN (
  '90e34b7b-7123-11f1-8bb6-52540021303b', -- ADMIN
  '90e34f44-7123-11f1-8bb6-52540021303b'  -- SUPERADMIN
)
AND (
  SELECT COUNT(*) FROM roles r
  WHERE r.scope = 'INTERNAL' AND (
    (r.id = '90de7f01-7123-11f1-8bb6-52540021303b' AND BINARY r.name = 'DEVELOPER') OR
    (r.id = '90e34b7b-7123-11f1-8bb6-52540021303b' AND BINARY r.name = 'ADMIN') OR
    (r.id = '90e34f44-7123-11f1-8bb6-52540021303b' AND BINARY r.name = 'SUPERADMIN')
  )
) = 3
AND EXISTS (
  SELECT 1 FROM role_permissions a
  WHERE a.role_id = '90e34b7b-7123-11f1-8bb6-52540021303b'
)
AND EXISTS (
  SELECT 1 FROM role_permissions s
  WHERE s.role_id = '90e34f44-7123-11f1-8bb6-52540021303b'
);

DELETE FROM role_permissions
WHERE role_id = '90de7f01-7123-11f1-8bb6-52540021303b'
AND EXISTS (SELECT 1 FROM developer_admin_permission_snapshot);

INSERT INTO role_permissions (role_id, permission_id, granted_at, granted_by)
SELECT '90de7f01-7123-11f1-8bb6-52540021303b', permission_id, NOW(), NULL
FROM developer_admin_permission_snapshot;

-- Counts must match and both difference counts must be zero when APPLIED.
SELECT
  CASE WHEN (SELECT COUNT(*) FROM developer_admin_permission_snapshot) > 0
    THEN 'APPLIED' ELSE 'SKIPPED: check role IDs, names, scopes and admin grants' END AS migration_status,
  (SELECT COUNT(*) FROM developer_admin_permission_snapshot) AS expected_combined_grants,
  (SELECT COUNT(*) FROM role_permissions WHERE role_id = '90de7f01-7123-11f1-8bb6-52540021303b') AS developer_grants;

SELECT COUNT(*) AS missing_developer_grants
FROM developer_admin_permission_snapshot expected
LEFT JOIN role_permissions actual
  ON actual.permission_id = expected.permission_id
 AND actual.role_id = '90de7f01-7123-11f1-8bb6-52540021303b'
WHERE actual.permission_id IS NULL;

SELECT COUNT(*) AS extra_developer_grants
FROM role_permissions actual
LEFT JOIN developer_admin_permission_snapshot expected ON expected.permission_id = actual.permission_id
WHERE actual.role_id = '90de7f01-7123-11f1-8bb6-52540021303b'
  AND expected.permission_id IS NULL;

COMMIT;
DROP TEMPORARY TABLE developer_admin_permission_snapshot;
