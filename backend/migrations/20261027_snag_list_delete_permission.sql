-- MySQL: safe to rerun; preserves existing role grants.
START TRANSACTION;
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at)
VALUES (UUID(), 'site-ops-snag-lists:delete', 'site-ops-snag-lists', 'delete', 'Delete snag lists and their saved revisions', NOW());
INSERT IGNORE INTO role_permissions (role_id, permission_id, granted_at, granted_by)
SELECT r.id, p.id, NOW(), NULL
FROM roles r CROSS JOIN permissions p
WHERE r.name IN ('ADMIN', 'SUPERADMIN')
  AND p.resource = 'site-ops-snag-lists' AND p.action = 'delete';
COMMIT;
SELECT p.name AS permission_name, r.name AS role_name
FROM permissions p
LEFT JOIN role_permissions rp ON rp.permission_id = p.id
LEFT JOIN roles r ON r.id = rp.role_id
WHERE p.resource = 'site-ops-snag-lists' AND p.action = 'delete';
