-- Restore the BOQ library capabilities used by the category management page.
START TRANSACTION;

INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at)
VALUES
  (UUID(), 'library:read', 'library', 'read', 'Staff API capability: library:read', NOW()),
  (UUID(), 'library:create', 'library', 'create', 'Staff API capability: library:create', NOW()),
  (UUID(), 'library:update', 'library', 'update', 'Staff API capability: library:update', NOW()),
  (UUID(), 'library:delete', 'library', 'delete', 'Staff API capability: library:delete', NOW());

-- The database may match legacy uppercase values through its collation.
-- Authentication builds permission keys from resource and action as stored.
UPDATE permissions
SET resource = 'library', action = LOWER(action)
WHERE LOWER(resource) = 'library'
  AND LOWER(action) IN ('read', 'create', 'update', 'delete')
  AND (BINARY resource <> BINARY 'library' OR BINARY action <> BINARY LOWER(action));

INSERT IGNORE INTO role_permissions (role_id, permission_id, granted_at, granted_by)
SELECT r.id, p.id, NOW(), NULL
FROM roles r
CROSS JOIN permissions p
WHERE r.scope = 'INTERNAL'
  AND r.name IN ('SUPERADMIN', 'ADMIN', 'DEVELOPER')
  AND p.resource = 'library'
  AND p.action IN ('read', 'create', 'update', 'delete');

COMMIT;
