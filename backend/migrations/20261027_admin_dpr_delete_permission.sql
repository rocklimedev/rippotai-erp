-- MySQL: register saved DPR deletion and grant ADMIN/SUPERADMIN access.
-- Safe to rerun; preserves existing grants.
START TRANSACTION;
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at)
VALUES (UUID(), 'dpr-admin-documents:delete', 'dpr-admin-documents', 'delete', 'Delete saved Admin DPR documents', NOW());
INSERT IGNORE INTO role_permissions (role_id, permission_id, granted_at, granted_by)
SELECT r.id, p.id, NOW(), NULL
FROM roles r CROSS JOIN permissions p
WHERE r.name IN ('ADMIN', 'SUPERADMIN')
  AND p.resource = 'dpr-admin-documents' AND p.action = 'delete';
COMMIT;
SELECT p.name AS permission_name, r.name AS role_name
FROM permissions p
LEFT JOIN role_permissions rp ON rp.permission_id = p.id
LEFT JOIN roles r ON r.id = rp.role_id
WHERE p.resource = 'dpr-admin-documents' AND p.action = 'delete';
