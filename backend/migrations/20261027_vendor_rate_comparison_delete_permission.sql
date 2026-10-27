-- MySQL: register the delete capability and grant it to administrator roles.
-- Safe to run more than once; existing grants are preserved.
START TRANSACTION;

INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at)
VALUES (
  UUID(),
  'vendor-rate-comparisons:delete',
  'vendor-rate-comparisons',
  'delete',
  'Delete saved vendor rate comparison sheets',
  NOW()
);

INSERT IGNORE INTO role_permissions (role_id, permission_id, granted_at, granted_by)
SELECT r.id, p.id, NOW(), NULL
FROM roles r
CROSS JOIN permissions p
WHERE r.name IN ('ADMIN', 'SUPERADMIN')
  AND p.resource = 'vendor-rate-comparisons'
  AND p.action = 'delete';

COMMIT;

-- Verify registration and administrator grants.
SELECT p.name AS permission_name, r.name AS role_name
FROM permissions p
LEFT JOIN role_permissions rp ON rp.permission_id = p.id
LEFT JOIN roles r ON r.id = rp.role_id
WHERE p.resource = 'vendor-rate-comparisons' AND p.action = 'delete';
