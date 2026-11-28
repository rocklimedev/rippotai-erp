START TRANSACTION;

INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at)
VALUES (UUID(), 'project-financial-values:read', 'project-financial-values', 'read',
        'View project financial values in shared screens and reports', NOW());

-- Bootstrap a grant holder because the access matrix requires the operator
-- to hold every permission they grant.
INSERT IGNORE INTO role_permissions (role_id, permission_id, granted_at, granted_by)
SELECT r.id, p.id, NOW(), NULL
FROM roles r
JOIN permissions p ON p.resource = 'project-financial-values' AND p.action = 'read'
WHERE r.name = 'SUPERADMIN' AND r.scope = 'INTERNAL';

COMMIT;
