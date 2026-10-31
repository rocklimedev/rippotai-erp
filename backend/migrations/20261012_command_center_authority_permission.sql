-- Super-authority dashboard (Command Center → Authority).
-- Adds the command-center:authority permission and grants it ONLY to the ADMIN and SUPERADMIN roles
-- (matched by name, so it works on any environment). Rerunnable.
INSERT INTO permissions (id, name, resource, action, description)
SELECT UUID(), 'command-center:authority', 'command-center', 'authority',
       'View the super-authority dashboard: approvals waiting on the owner, margins, access and audit trail'
 WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'command-center:authority');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
  FROM roles r JOIN permissions p ON p.name = 'command-center:authority'
 WHERE BINARY r.name IN ('ADMIN', 'SUPERADMIN');
