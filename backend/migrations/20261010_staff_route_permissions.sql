-- Generated from reviewed route decorators. Apply before deploying global RBAC.
-- Existing staff grants are preserved. Only ADMIN/SUPERADMIN receive new grants.
START TRANSACTION;
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'activity-logs:create', 'activity-logs', 'create', 'Staff API capability: activity-logs:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'activity-logs:read', 'activity-logs', 'read', 'Staff API capability: activity-logs:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'apps:create', 'apps', 'create', 'Staff API capability: apps:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'apps:delete', 'apps', 'delete', 'Staff API capability: apps:delete', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'apps:read', 'apps', 'read', 'Staff API capability: apps:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'apps:update', 'apps', 'update', 'Staff API capability: apps:update', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'architect-quality:create', 'architect-quality', 'create', 'Staff API capability: architect-quality:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'architect-quality:delete', 'architect-quality', 'delete', 'Staff API capability: architect-quality:delete', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'architect-quality:read', 'architect-quality', 'read', 'Staff API capability: architect-quality:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'architect-quality:update', 'architect-quality', 'update', 'Staff API capability: architect-quality:update', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'architect-snags:create', 'architect-snags', 'create', 'Staff API capability: architect-snags:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'architect-snags:delete', 'architect-snags', 'delete', 'Staff API capability: architect-snags:delete', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'architect-snags:read', 'architect-snags', 'read', 'Staff API capability: architect-snags:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'architect-snags:update', 'architect-snags', 'update', 'Staff API capability: architect-snags:update', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'architect-visit-stages:create', 'architect-visit-stages', 'create', 'Staff API capability: architect-visit-stages:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'architect-visit-stages:delete', 'architect-visit-stages', 'delete', 'Staff API capability: architect-visit-stages:delete', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'architect-visit-stages:read', 'architect-visit-stages', 'read', 'Staff API capability: architect-visit-stages:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'architect-visit-stages:update', 'architect-visit-stages', 'update', 'Staff API capability: architect-visit-stages:update', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'auth-google:connect', 'auth-google', 'connect', 'Staff API capability: auth-google:connect', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'auth-google:delete', 'auth-google', 'delete', 'Staff API capability: auth-google:delete', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'auth-google:read', 'auth-google', 'read', 'Staff API capability: auth-google:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'auth-microsoft:connect', 'auth-microsoft', 'connect', 'Staff API capability: auth-microsoft:connect', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'auth-microsoft:delete', 'auth-microsoft', 'delete', 'Staff API capability: auth-microsoft:delete', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'auth-microsoft:read', 'auth-microsoft', 'read', 'Staff API capability: auth-microsoft:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'auth-tokens:delete', 'auth-tokens', 'delete', 'Staff API capability: auth-tokens:delete', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'auth-zoho:connect', 'auth-zoho', 'connect', 'Staff API capability: auth-zoho:connect', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'auth-zoho:delete', 'auth-zoho', 'delete', 'Staff API capability: auth-zoho:delete', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'auth-zoho:read', 'auth-zoho', 'read', 'Staff API capability: auth-zoho:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'automation:create', 'automation', 'create', 'Staff API capability: automation:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'automation:delete', 'automation', 'delete', 'Staff API capability: automation:delete', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'automation:execute', 'automation', 'execute', 'Staff API capability: automation:execute', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'automation:read', 'automation', 'read', 'Staff API capability: automation:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'automation:update', 'automation', 'update', 'Staff API capability: automation:update', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'boq-activity:read', 'boq-activity', 'read', 'Staff API capability: boq-activity:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'boq-catalog:read', 'boq-catalog', 'read', 'Staff API capability: boq-catalog:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'boq-templates:create', 'boq-templates', 'create', 'Staff API capability: boq-templates:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'boq-templates:delete', 'boq-templates', 'delete', 'Staff API capability: boq-templates:delete', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'boq-templates:read', 'boq-templates', 'read', 'Staff API capability: boq-templates:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'boq-templates:update', 'boq-templates', 'update', 'Staff API capability: boq-templates:update', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'boq:approve', 'boq', 'approve', 'Staff API capability: boq:approve', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'boq:create', 'boq', 'create', 'Staff API capability: boq:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'boq:delete', 'boq', 'delete', 'Staff API capability: boq:delete', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'boq:export', 'boq', 'export', 'Staff API capability: boq:export', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'boq:read', 'boq', 'read', 'Staff API capability: boq:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'boq:submit', 'boq', 'submit', 'Staff API capability: boq:submit', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'boq:update', 'boq', 'update', 'Staff API capability: boq:update', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'budget-estimates:create', 'budget-estimates', 'create', 'Staff API capability: budget-estimates:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'budget-estimates:delete', 'budget-estimates', 'delete', 'Staff API capability: budget-estimates:delete', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'budget-estimates:lock', 'budget-estimates', 'lock', 'Staff API capability: budget-estimates:lock', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'budget-estimates:read', 'budget-estimates', 'read', 'Staff API capability: budget-estimates:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'budget-estimates:recalculate', 'budget-estimates', 'recalculate', 'Staff API capability: budget-estimates:recalculate', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'budget-estimates:update', 'budget-estimates', 'update', 'Staff API capability: budget-estimates:update', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'business-proposals:create', 'business-proposals', 'create', 'Staff API capability: business-proposals:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'business-proposals:read', 'business-proposals', 'read', 'Staff API capability: business-proposals:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'business-proposals:update', 'business-proposals', 'update', 'Staff API capability: business-proposals:update', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'calendar-events:create', 'calendar-events', 'create', 'Staff API capability: calendar-events:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'calendar-events:delete', 'calendar-events', 'delete', 'Staff API capability: calendar-events:delete', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'calendar-events:read', 'calendar-events', 'read', 'Staff API capability: calendar-events:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'calendar-events:update', 'calendar-events', 'update', 'Staff API capability: calendar-events:update', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'cdn:upload', 'cdn', 'upload', 'Staff API capability: cdn:upload', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'client-portal:create', 'client-portal', 'create', 'Staff API capability: client-portal:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'client-portal:deliver', 'client-portal', 'deliver', 'Staff API capability: client-portal:deliver', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'client-portal:prepare', 'client-portal', 'prepare', 'Staff API capability: client-portal:prepare', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'client-portal:read', 'client-portal', 'read', 'Staff API capability: client-portal:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'client-portal:revoke', 'client-portal', 'revoke', 'Staff API capability: client-portal:revoke', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'clients:create', 'clients', 'create', 'Staff API capability: clients:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'clients:delete', 'clients', 'delete', 'Staff API capability: clients:delete', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'clients:read', 'clients', 'read', 'Staff API capability: clients:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'clients:restore', 'clients', 'restore', 'Staff API capability: clients:restore', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'clients:update', 'clients', 'update', 'Staff API capability: clients:update', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'command-center:approve', 'command-center', 'approve', 'Staff API capability: command-center:approve', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'command-center:complete', 'command-center', 'complete', 'Staff API capability: command-center:complete', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'command-center:read', 'command-center', 'read', 'Staff API capability: command-center:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'command-center:refresh', 'command-center', 'refresh', 'Staff API capability: command-center:refresh', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'command-center:review', 'command-center', 'review', 'Staff API capability: command-center:review', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'command-center:upload', 'command-center', 'upload', 'Staff API capability: command-center:upload', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'dashboard:read', 'dashboard', 'read', 'Staff API capability: dashboard:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'dashboards:read', 'dashboards', 'read', 'Staff API capability: dashboards:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'dashboards:reset', 'dashboards', 'reset', 'Staff API capability: dashboards:reset', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'dashboards:update', 'dashboards', 'update', 'Staff API capability: dashboards:update', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'delivery-challans:create', 'delivery-challans', 'create', 'Staff API capability: delivery-challans:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'delivery-challans:delete', 'delivery-challans', 'delete', 'Staff API capability: delivery-challans:delete', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'delivery-challans:read', 'delivery-challans', 'read', 'Staff API capability: delivery-challans:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'delivery-challans:receive', 'delivery-challans', 'receive', 'Staff API capability: delivery-challans:receive', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'delivery-challans:update', 'delivery-challans', 'update', 'Staff API capability: delivery-challans:update', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'document-requirements:create', 'document-requirements', 'create', 'Staff API capability: document-requirements:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'document-requirements:delete', 'document-requirements', 'delete', 'Staff API capability: document-requirements:delete', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'document-requirements:read', 'document-requirements', 'read', 'Staff API capability: document-requirements:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'document-requirements:update', 'document-requirements', 'update', 'Staff API capability: document-requirements:update', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'document-types:create', 'document-types', 'create', 'Staff API capability: document-types:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'document-types:delete', 'document-types', 'delete', 'Staff API capability: document-types:delete', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'document-types:read', 'document-types', 'read', 'Staff API capability: document-types:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'document-types:update', 'document-types', 'update', 'Staff API capability: document-types:update', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'documents:create', 'documents', 'create', 'Staff API capability: documents:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'documents:delete', 'documents', 'delete', 'Staff API capability: documents:delete', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'documents:deliver', 'documents', 'deliver', 'Staff API capability: documents:deliver', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'documents:read', 'documents', 'read', 'Staff API capability: documents:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'documents:update', 'documents', 'update', 'Staff API capability: documents:update', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'dpr-admin-documents:create', 'dpr-admin-documents', 'create', 'Staff API capability: dpr-admin-documents:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'dpr-admin-documents:export', 'dpr-admin-documents', 'export', 'Staff API capability: dpr-admin-documents:export', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'dpr-admin-documents:read', 'dpr-admin-documents', 'read', 'Staff API capability: dpr-admin-documents:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'dpr-admin-logs:create', 'dpr-admin-logs', 'create', 'Staff API capability: dpr-admin-logs:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'dpr-admin-logs:delete', 'dpr-admin-logs', 'delete', 'Staff API capability: dpr-admin-logs:delete', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'dpr-admin-logs:read', 'dpr-admin-logs', 'read', 'Staff API capability: dpr-admin-logs:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'dpr-admin-logs:update', 'dpr-admin-logs', 'update', 'Staff API capability: dpr-admin-logs:update', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'dpr-admin-reports:create', 'dpr-admin-reports', 'create', 'Staff API capability: dpr-admin-reports:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'dpr-admin-reports:delete', 'dpr-admin-reports', 'delete', 'Staff API capability: dpr-admin-reports:delete', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'dpr-admin-reports:export', 'dpr-admin-reports', 'export', 'Staff API capability: dpr-admin-reports:export', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'dpr-admin-reports:read', 'dpr-admin-reports', 'read', 'Staff API capability: dpr-admin-reports:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'dpr-admin-reports:update', 'dpr-admin-reports', 'update', 'Staff API capability: dpr-admin-reports:update', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'drawings:create', 'drawings', 'create', 'Staff API capability: drawings:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'drawings:delete', 'drawings', 'delete', 'Staff API capability: drawings:delete', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'drawings:read', 'drawings', 'read', 'Staff API capability: drawings:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'drawings:update', 'drawings', 'update', 'Staff API capability: drawings:update', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'gates:clear', 'gates', 'clear', 'Staff API capability: gates:clear', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'gates:create', 'gates', 'create', 'Staff API capability: gates:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'gates:read', 'gates', 'read', 'Staff API capability: gates:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'gates:reopen', 'gates', 'reopen', 'Staff API capability: gates:reopen', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'google-calendar:create', 'google-calendar', 'create', 'Staff API capability: google-calendar:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'google-calendar:delete', 'google-calendar', 'delete', 'Staff API capability: google-calendar:delete', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'google-calendar:read', 'google-calendar', 'read', 'Staff API capability: google-calendar:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'google-calendar:update', 'google-calendar', 'update', 'Staff API capability: google-calendar:update', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'google-tasks:complete', 'google-tasks', 'complete', 'Staff API capability: google-tasks:complete', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'google-tasks:create', 'google-tasks', 'create', 'Staff API capability: google-tasks:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'google-tasks:delete', 'google-tasks', 'delete', 'Staff API capability: google-tasks:delete', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'google-tasks:read', 'google-tasks', 'read', 'Staff API capability: google-tasks:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'google-tasks:update', 'google-tasks', 'update', 'Staff API capability: google-tasks:update', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'inventory:adjust', 'inventory', 'adjust', 'Staff API capability: inventory:adjust', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'inventory:create', 'inventory', 'create', 'Staff API capability: inventory:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'inventory:deliver', 'inventory', 'deliver', 'Staff API capability: inventory:deliver', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'inventory:issue', 'inventory', 'issue', 'Staff API capability: inventory:issue', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'inventory:read', 'inventory', 'read', 'Staff API capability: inventory:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'inventory:return', 'inventory', 'return', 'Staff API capability: inventory:return', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'inventory:transfer', 'inventory', 'transfer', 'Staff API capability: inventory:transfer', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'leads:create', 'leads', 'create', 'Staff API capability: leads:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'leads:delete', 'leads', 'delete', 'Staff API capability: leads:delete', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'leads:read', 'leads', 'read', 'Staff API capability: leads:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'leads:sync', 'leads', 'sync', 'Staff API capability: leads:sync', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'leads:update', 'leads', 'update', 'Staff API capability: leads:update', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'library:create', 'library', 'create', 'Staff API capability: library:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'library:delete', 'library', 'delete', 'Staff API capability: library:delete', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'library:read', 'library', 'read', 'Staff API capability: library:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'library:update', 'library', 'update', 'Staff API capability: library:update', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'material-procurement:create', 'material-procurement', 'create', 'Staff API capability: material-procurement:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'material-procurement:delete', 'material-procurement', 'delete', 'Staff API capability: material-procurement:delete', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'material-procurement:read', 'material-procurement', 'read', 'Staff API capability: material-procurement:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'material-procurement:submit', 'material-procurement', 'submit', 'Staff API capability: material-procurement:submit', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'material-procurement:update', 'material-procurement', 'update', 'Staff API capability: material-procurement:update', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'materials:create', 'materials', 'create', 'Staff API capability: materials:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'materials:delete', 'materials', 'delete', 'Staff API capability: materials:delete', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'materials:read', 'materials', 'read', 'Staff API capability: materials:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'materials:update', 'materials', 'update', 'Staff API capability: materials:update', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'notes:create', 'notes', 'create', 'Staff API capability: notes:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'notes:delete', 'notes', 'delete', 'Staff API capability: notes:delete', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'notes:read', 'notes', 'read', 'Staff API capability: notes:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'notes:update', 'notes', 'update', 'Staff API capability: notes:update', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'notifications:delete', 'notifications', 'delete', 'Staff API capability: notifications:delete', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'notifications:read', 'notifications', 'read', 'Staff API capability: notifications:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'notifications:update', 'notifications', 'update', 'Staff API capability: notifications:update', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'onedrive:create', 'onedrive', 'create', 'Staff API capability: onedrive:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'onedrive:delete', 'onedrive', 'delete', 'Staff API capability: onedrive:delete', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'onedrive:read', 'onedrive', 'read', 'Staff API capability: onedrive:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'onedrive:update', 'onedrive', 'update', 'Staff API capability: onedrive:update', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'onedrive:upload', 'onedrive', 'upload', 'Staff API capability: onedrive:upload', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'payment-schedules:create', 'payment-schedules', 'create', 'Staff API capability: payment-schedules:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'payment-schedules:delete', 'payment-schedules', 'delete', 'Staff API capability: payment-schedules:delete', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'payment-schedules:read', 'payment-schedules', 'read', 'Staff API capability: payment-schedules:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'payment-schedules:update', 'payment-schedules', 'update', 'Staff API capability: payment-schedules:update', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'permissions:create', 'permissions', 'create', 'Staff API capability: permissions:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'permissions:delete', 'permissions', 'delete', 'Staff API capability: permissions:delete', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'permissions:read', 'permissions', 'read', 'Staff API capability: permissions:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'permissions:update', 'permissions', 'update', 'Staff API capability: permissions:update', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'phase-definitions:read', 'phase-definitions', 'read', 'Staff API capability: phase-definitions:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'plan-of-actions:create', 'plan-of-actions', 'create', 'Staff API capability: plan-of-actions:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'plan-of-actions:delete', 'plan-of-actions', 'delete', 'Staff API capability: plan-of-actions:delete', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'plan-of-actions:publish', 'plan-of-actions', 'publish', 'Staff API capability: plan-of-actions:publish', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'plan-of-actions:read', 'plan-of-actions', 'read', 'Staff API capability: plan-of-actions:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'plan-of-actions:update', 'plan-of-actions', 'update', 'Staff API capability: plan-of-actions:update', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'procurement-estimates:approve', 'procurement-estimates', 'approve', 'Staff API capability: procurement-estimates:approve', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'procurement-estimates:create', 'procurement-estimates', 'create', 'Staff API capability: procurement-estimates:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'procurement-estimates:read', 'procurement-estimates', 'read', 'Staff API capability: procurement-estimates:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'procurement-estimates:reject', 'procurement-estimates', 'reject', 'Staff API capability: procurement-estimates:reject', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'procurement-quotations:accept', 'procurement-quotations', 'accept', 'Staff API capability: procurement-quotations:accept', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'procurement-quotations:create', 'procurement-quotations', 'create', 'Staff API capability: procurement-quotations:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'procurement-quotations:read', 'procurement-quotations', 'read', 'Staff API capability: procurement-quotations:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'procurement-quotations:reject', 'procurement-quotations', 'reject', 'Staff API capability: procurement-quotations:reject', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'procurement-quotations:send', 'procurement-quotations', 'send', 'Staff API capability: procurement-quotations:send', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'procurement-rate-sheets:approve', 'procurement-rate-sheets', 'approve', 'Staff API capability: procurement-rate-sheets:approve', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'procurement-rate-sheets:create', 'procurement-rate-sheets', 'create', 'Staff API capability: procurement-rate-sheets:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'procurement-rate-sheets:delete', 'procurement-rate-sheets', 'delete', 'Staff API capability: procurement-rate-sheets:delete', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'procurement-rate-sheets:read', 'procurement-rate-sheets', 'read', 'Staff API capability: procurement-rate-sheets:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'procurement-rate-sheets:reject', 'procurement-rate-sheets', 'reject', 'Staff API capability: procurement-rate-sheets:reject', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'procurement-requirements:create', 'procurement-requirements', 'create', 'Staff API capability: procurement-requirements:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'procurement-requirements:delete', 'procurement-requirements', 'delete', 'Staff API capability: procurement-requirements:delete', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'procurement-requirements:read', 'procurement-requirements', 'read', 'Staff API capability: procurement-requirements:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'procurement-requirements:update', 'procurement-requirements', 'update', 'Staff API capability: procurement-requirements:update', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'procurement-sample-boards:approve', 'procurement-sample-boards', 'approve', 'Staff API capability: procurement-sample-boards:approve', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'procurement-sample-boards:create', 'procurement-sample-boards', 'create', 'Staff API capability: procurement-sample-boards:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'procurement-sample-boards:delete', 'procurement-sample-boards', 'delete', 'Staff API capability: procurement-sample-boards:delete', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'procurement-sample-boards:read', 'procurement-sample-boards', 'read', 'Staff API capability: procurement-sample-boards:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'procurement-sample-boards:reject', 'procurement-sample-boards', 'reject', 'Staff API capability: procurement-sample-boards:reject', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'project-briefs:create', 'project-briefs', 'create', 'Staff API capability: project-briefs:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'project-briefs:delete', 'project-briefs', 'delete', 'Staff API capability: project-briefs:delete', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'project-briefs:read', 'project-briefs', 'read', 'Staff API capability: project-briefs:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'project-briefs:update', 'project-briefs', 'update', 'Staff API capability: project-briefs:update', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'project-briefs:upload', 'project-briefs', 'upload', 'Staff API capability: project-briefs:upload', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'project-dashboard:read', 'project-dashboard', 'read', 'Staff API capability: project-dashboard:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'project-planners:create', 'project-planners', 'create', 'Staff API capability: project-planners:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'project-planners:delete', 'project-planners', 'delete', 'Staff API capability: project-planners:delete', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'project-planners:generate', 'project-planners', 'generate', 'Staff API capability: project-planners:generate', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'project-planners:read', 'project-planners', 'read', 'Staff API capability: project-planners:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'project-planners:update', 'project-planners', 'update', 'Staff API capability: project-planners:update', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'project-shortlists:create', 'project-shortlists', 'create', 'Staff API capability: project-shortlists:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'project-shortlists:delete', 'project-shortlists', 'delete', 'Staff API capability: project-shortlists:delete', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'project-shortlists:export', 'project-shortlists', 'export', 'Staff API capability: project-shortlists:export', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'project-shortlists:read', 'project-shortlists', 'read', 'Staff API capability: project-shortlists:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'project-shortlists:update', 'project-shortlists', 'update', 'Staff API capability: project-shortlists:update', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'project-types:create', 'project-types', 'create', 'Staff API capability: project-types:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'project-types:delete', 'project-types', 'delete', 'Staff API capability: project-types:delete', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'project-types:read', 'project-types', 'read', 'Staff API capability: project-types:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'project-types:update', 'project-types', 'update', 'Staff API capability: project-types:update', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'projects-phases:create', 'projects-phases', 'create', 'Staff API capability: projects-phases:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'projects-phases:delete', 'projects-phases', 'delete', 'Staff API capability: projects-phases:delete', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'projects-phases:read', 'projects-phases', 'read', 'Staff API capability: projects-phases:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'projects-phases:update', 'projects-phases', 'update', 'Staff API capability: projects-phases:update', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'projects:create', 'projects', 'create', 'Staff API capability: projects:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'projects:delete', 'projects', 'delete', 'Staff API capability: projects:delete', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'projects:read', 'projects', 'read', 'Staff API capability: projects:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'projects:restore', 'projects', 'restore', 'Staff API capability: projects:restore', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'projects:update', 'projects', 'update', 'Staff API capability: projects:update', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'purchase-orders:approve', 'purchase-orders', 'approve', 'Staff API capability: purchase-orders:approve', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'purchase-orders:cancel', 'purchase-orders', 'cancel', 'Staff API capability: purchase-orders:cancel', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'purchase-orders:create', 'purchase-orders', 'create', 'Staff API capability: purchase-orders:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'purchase-orders:delete', 'purchase-orders', 'delete', 'Staff API capability: purchase-orders:delete', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'purchase-orders:read', 'purchase-orders', 'read', 'Staff API capability: purchase-orders:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'purchase-orders:update', 'purchase-orders', 'update', 'Staff API capability: purchase-orders:update', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'quality-checklists:create', 'quality-checklists', 'create', 'Staff API capability: quality-checklists:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'quality-checklists:delete', 'quality-checklists', 'delete', 'Staff API capability: quality-checklists:delete', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'quality-checklists:export', 'quality-checklists', 'export', 'Staff API capability: quality-checklists:export', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'quality-checklists:read', 'quality-checklists', 'read', 'Staff API capability: quality-checklists:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'quality-checklists:update', 'quality-checklists', 'update', 'Staff API capability: quality-checklists:update', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'quotation-items:create', 'quotation-items', 'create', 'Staff API capability: quotation-items:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'quotation-items:delete', 'quotation-items', 'delete', 'Staff API capability: quotation-items:delete', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'quotation-items:read', 'quotation-items', 'read', 'Staff API capability: quotation-items:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'quotation-items:update', 'quotation-items', 'update', 'Staff API capability: quotation-items:update', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'quotations:approve', 'quotations', 'approve', 'Staff API capability: quotations:approve', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'quotations:create', 'quotations', 'create', 'Staff API capability: quotations:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'quotations:delete', 'quotations', 'delete', 'Staff API capability: quotations:delete', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'quotations:export', 'quotations', 'export', 'Staff API capability: quotations:export', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'quotations:read', 'quotations', 'read', 'Staff API capability: quotations:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'quotations:restore', 'quotations', 'restore', 'Staff API capability: quotations:restore', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'quotations:select', 'quotations', 'select', 'Staff API capability: quotations:select', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'quotations:submit', 'quotations', 'submit', 'Staff API capability: quotations:submit', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'quotations:update', 'quotations', 'update', 'Staff API capability: quotations:update', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'rbac:create', 'rbac', 'create', 'Staff API capability: rbac:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'rbac:delete', 'rbac', 'delete', 'Staff API capability: rbac:delete', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'rbac:read', 'rbac', 'read', 'Staff API capability: rbac:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'rbac:update', 'rbac', 'update', 'Staff API capability: rbac:update', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'reports:read', 'reports', 'read', 'Staff API capability: reports:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'role-apps:assign', 'role-apps', 'assign', 'Staff API capability: role-apps:assign', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'role-apps:grant', 'role-apps', 'grant', 'Staff API capability: role-apps:grant', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'role-apps:read', 'role-apps', 'read', 'Staff API capability: role-apps:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'role-apps:revoke', 'role-apps', 'revoke', 'Staff API capability: role-apps:revoke', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'role-apps:update', 'role-apps', 'update', 'Staff API capability: role-apps:update', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'role-permissions:assign', 'role-permissions', 'assign', 'Staff API capability: role-permissions:assign', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'role-permissions:grant', 'role-permissions', 'grant', 'Staff API capability: role-permissions:grant', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'role-permissions:read', 'role-permissions', 'read', 'Staff API capability: role-permissions:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'role-permissions:revoke', 'role-permissions', 'revoke', 'Staff API capability: role-permissions:revoke', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'scope-of-work:create', 'scope-of-work', 'create', 'Staff API capability: scope-of-work:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'scope-of-work:delete', 'scope-of-work', 'delete', 'Staff API capability: scope-of-work:delete', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'scope-of-work:read', 'scope-of-work', 'read', 'Staff API capability: scope-of-work:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'scope-of-work:update', 'scope-of-work', 'update', 'Staff API capability: scope-of-work:update', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'search:read', 'search', 'read', 'Staff API capability: search:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'search:reindex', 'search', 'reindex', 'Staff API capability: search:reindex', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'sessions:read-any', 'sessions', 'read-any', 'Staff API capability: sessions:read-any', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'sessions:revoke-any', 'sessions', 'revoke-any', 'Staff API capability: sessions:revoke-any', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'settings:create', 'settings', 'create', 'Staff API capability: settings:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'settings:delete', 'settings', 'delete', 'Staff API capability: settings:delete', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'settings:read', 'settings', 'read', 'Staff API capability: settings:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'settings:update', 'settings', 'update', 'Staff API capability: settings:update', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'shortlist-entries:create', 'shortlist-entries', 'create', 'Staff API capability: shortlist-entries:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'shortlist-entries:delete', 'shortlist-entries', 'delete', 'Staff API capability: shortlist-entries:delete', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'shortlist-entries:read', 'shortlist-entries', 'read', 'Staff API capability: shortlist-entries:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'shortlist-entries:select', 'shortlist-entries', 'select', 'Staff API capability: shortlist-entries:select', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'shortlist-entries:update', 'shortlist-entries', 'update', 'Staff API capability: shortlist-entries:update', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'shortlist-packages:apply', 'shortlist-packages', 'apply', 'Staff API capability: shortlist-packages:apply', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'shortlist-packages:create', 'shortlist-packages', 'create', 'Staff API capability: shortlist-packages:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'shortlist-packages:delete', 'shortlist-packages', 'delete', 'Staff API capability: shortlist-packages:delete', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'shortlist-packages:read', 'shortlist-packages', 'read', 'Staff API capability: shortlist-packages:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'site-ops-checklists:create', 'site-ops-checklists', 'create', 'Staff API capability: site-ops-checklists:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'site-ops-checklists:read', 'site-ops-checklists', 'read', 'Staff API capability: site-ops-checklists:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'site-ops-daily-reports:create', 'site-ops-daily-reports', 'create', 'Staff API capability: site-ops-daily-reports:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'site-ops-daily-reports:delete', 'site-ops-daily-reports', 'delete', 'Staff API capability: site-ops-daily-reports:delete', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'site-ops-daily-reports:read', 'site-ops-daily-reports', 'read', 'Staff API capability: site-ops-daily-reports:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'site-ops-daily-reports:share', 'site-ops-daily-reports', 'share', 'Staff API capability: site-ops-daily-reports:share', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'site-ops-daily-reports:update', 'site-ops-daily-reports', 'update', 'Staff API capability: site-ops-daily-reports:update', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'site-ops-daily-reports:upload', 'site-ops-daily-reports', 'upload', 'Staff API capability: site-ops-daily-reports:upload', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'site-ops-mockups:create', 'site-ops-mockups', 'create', 'Staff API capability: site-ops-mockups:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'site-ops-mockups:read', 'site-ops-mockups', 'read', 'Staff API capability: site-ops-mockups:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'site-ops-mockups:update', 'site-ops-mockups', 'update', 'Staff API capability: site-ops-mockups:update', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'site-ops-qc:read', 'site-ops-qc', 'read', 'Staff API capability: site-ops-qc:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'site-ops-qc:sign-off', 'site-ops-qc', 'sign-off', 'Staff API capability: site-ops-qc:sign-off', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'site-ops-rfis:create', 'site-ops-rfis', 'create', 'Staff API capability: site-ops-rfis:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'site-ops-rfis:read', 'site-ops-rfis', 'read', 'Staff API capability: site-ops-rfis:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'site-ops-rfis:update', 'site-ops-rfis', 'update', 'Staff API capability: site-ops-rfis:update', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'site-ops-snag-lists:create', 'site-ops-snag-lists', 'create', 'Staff API capability: site-ops-snag-lists:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'site-ops-snag-lists:export', 'site-ops-snag-lists', 'export', 'Staff API capability: site-ops-snag-lists:export', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'site-ops-snag-lists:read', 'site-ops-snag-lists', 'read', 'Staff API capability: site-ops-snag-lists:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'site-ops-snag-lists:update', 'site-ops-snag-lists', 'update', 'Staff API capability: site-ops-snag-lists:update', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'site-ops-snag-lists:upload', 'site-ops-snag-lists', 'upload', 'Staff API capability: site-ops-snag-lists:upload', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'site-ops-visits:assign', 'site-ops-visits', 'assign', 'Staff API capability: site-ops-visits:assign', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'site-ops-visits:check-in', 'site-ops-visits', 'check-in', 'Staff API capability: site-ops-visits:check-in', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'site-ops-visits:create', 'site-ops-visits', 'create', 'Staff API capability: site-ops-visits:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'site-ops-visits:read', 'site-ops-visits', 'read', 'Staff API capability: site-ops-visits:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'site-ops-visits:update', 'site-ops-visits', 'update', 'Staff API capability: site-ops-visits:update', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'site-ops:read', 'site-ops', 'read', 'Staff API capability: site-ops:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'site-recces:create', 'site-recces', 'create', 'Staff API capability: site-recces:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'site-recces:delete', 'site-recces', 'delete', 'Staff API capability: site-recces:delete', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'site-recces:read', 'site-recces', 'read', 'Staff API capability: site-recces:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'site-recces:restore', 'site-recces', 'restore', 'Staff API capability: site-recces:restore', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'site-recces:update', 'site-recces', 'update', 'Staff API capability: site-recces:update', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'site-recces:upload', 'site-recces', 'upload', 'Staff API capability: site-recces:upload', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'sync:read', 'sync', 'read', 'Staff API capability: sync:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'sync:sync', 'sync', 'sync', 'Staff API capability: sync:sync', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'sync:update', 'sync', 'update', 'Staff API capability: sync:update', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'system:read', 'system', 'read', 'Staff API capability: system:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'tasks:create', 'tasks', 'create', 'Staff API capability: tasks:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'tasks:delete', 'tasks', 'delete', 'Staff API capability: tasks:delete', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'tasks:read', 'tasks', 'read', 'Staff API capability: tasks:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'tasks:update', 'tasks', 'update', 'Staff API capability: tasks:update', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'team:create', 'team', 'create', 'Staff API capability: team:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'team:delete', 'team', 'delete', 'Staff API capability: team:delete', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'team:read', 'team', 'read', 'Staff API capability: team:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'team:update', 'team', 'update', 'Staff API capability: team:update', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'terms-templates:create', 'terms-templates', 'create', 'Staff API capability: terms-templates:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'terms-templates:delete', 'terms-templates', 'delete', 'Staff API capability: terms-templates:delete', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'terms-templates:read', 'terms-templates', 'read', 'Staff API capability: terms-templates:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'terms-templates:update', 'terms-templates', 'update', 'Staff API capability: terms-templates:update', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'units:create', 'units', 'create', 'Staff API capability: units:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'units:delete', 'units', 'delete', 'Staff API capability: units:delete', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'units:read', 'units', 'read', 'Staff API capability: units:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'units:update', 'units', 'update', 'Staff API capability: units:update', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'user-signatures:delete', 'user-signatures', 'delete', 'Staff API capability: user-signatures:delete', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'user-signatures:read', 'user-signatures', 'read', 'Staff API capability: user-signatures:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'user-signatures:upload', 'user-signatures', 'upload', 'Staff API capability: user-signatures:upload', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'users:create', 'users', 'create', 'Staff API capability: users:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'users:delete', 'users', 'delete', 'Staff API capability: users:delete', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'users:read', 'users', 'read', 'Staff API capability: users:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'users:update', 'users', 'update', 'Staff API capability: users:update', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'vendor-business-types:create', 'vendor-business-types', 'create', 'Staff API capability: vendor-business-types:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'vendor-business-types:read', 'vendor-business-types', 'read', 'Staff API capability: vendor-business-types:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'vendor-categories:read', 'vendor-categories', 'read', 'Staff API capability: vendor-categories:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'vendor-rate-comparisons:create', 'vendor-rate-comparisons', 'create', 'Staff API capability: vendor-rate-comparisons:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'vendor-rate-comparisons:read', 'vendor-rate-comparisons', 'read', 'Staff API capability: vendor-rate-comparisons:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'vendor-rate-comparisons:update', 'vendor-rate-comparisons', 'update', 'Staff API capability: vendor-rate-comparisons:update', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'vendors-saved-searches:create', 'vendors-saved-searches', 'create', 'Staff API capability: vendors-saved-searches:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'vendors-saved-searches:delete', 'vendors-saved-searches', 'delete', 'Staff API capability: vendors-saved-searches:delete', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'vendors-saved-searches:read', 'vendors-saved-searches', 'read', 'Staff API capability: vendors-saved-searches:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'vendors:create', 'vendors', 'create', 'Staff API capability: vendors:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'vendors:delete', 'vendors', 'delete', 'Staff API capability: vendors:delete', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'vendors:read', 'vendors', 'read', 'Staff API capability: vendors:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'vendors:update', 'vendors', 'update', 'Staff API capability: vendors:update', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'work-orders:approve', 'work-orders', 'approve', 'Staff API capability: work-orders:approve', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'work-orders:create', 'work-orders', 'create', 'Staff API capability: work-orders:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'work-orders:delete', 'work-orders', 'delete', 'Staff API capability: work-orders:delete', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'work-orders:read', 'work-orders', 'read', 'Staff API capability: work-orders:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'work-orders:reject', 'work-orders', 'reject', 'Staff API capability: work-orders:reject', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'work-orders:update', 'work-orders', 'update', 'Staff API capability: work-orders:update', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'workflow-library:assign', 'workflow-library', 'assign', 'Staff API capability: workflow-library:assign', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'workflow-library:create', 'workflow-library', 'create', 'Staff API capability: workflow-library:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'workflow-library:delete', 'workflow-library', 'delete', 'Staff API capability: workflow-library:delete', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'workflow-library:deliver', 'workflow-library', 'deliver', 'Staff API capability: workflow-library:deliver', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'workflow-library:read', 'workflow-library', 'read', 'Staff API capability: workflow-library:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'workflow-library:update', 'workflow-library', 'update', 'Staff API capability: workflow-library:update', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'workflow-progress:create', 'workflow-progress', 'create', 'Staff API capability: workflow-progress:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'workflow-progress:read', 'workflow-progress', 'read', 'Staff API capability: workflow-progress:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'workflow-progress:sign-off', 'workflow-progress', 'sign-off', 'Staff API capability: workflow-progress:sign-off', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'workflow-progress:update', 'workflow-progress', 'update', 'Staff API capability: workflow-progress:update', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'workflow-timeline:read', 'workflow-timeline', 'read', 'Staff API capability: workflow-timeline:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'workflow:create', 'workflow', 'create', 'Staff API capability: workflow:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'workflow:read', 'workflow', 'read', 'Staff API capability: workflow:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'workflow:update', 'workflow', 'update', 'Staff API capability: workflow:update', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'workspace:read', 'workspace', 'read', 'Staff API capability: workspace:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'zoho-bigin:create', 'zoho-bigin', 'create', 'Staff API capability: zoho-bigin:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'zoho-bigin:delete', 'zoho-bigin', 'delete', 'Staff API capability: zoho-bigin:delete', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'zoho-bigin:read', 'zoho-bigin', 'read', 'Staff API capability: zoho-bigin:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'zoho-bigin:update', 'zoho-bigin', 'update', 'Staff API capability: zoho-bigin:update', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'zoho-calendar:create', 'zoho-calendar', 'create', 'Staff API capability: zoho-calendar:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'zoho-calendar:delete', 'zoho-calendar', 'delete', 'Staff API capability: zoho-calendar:delete', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'zoho-calendar:read', 'zoho-calendar', 'read', 'Staff API capability: zoho-calendar:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'zoho-calendar:update', 'zoho-calendar', 'update', 'Staff API capability: zoho-calendar:update', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'zoho-cliq:read', 'zoho-cliq', 'read', 'Staff API capability: zoho-cliq:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'zoho-cliq:send', 'zoho-cliq', 'send', 'Staff API capability: zoho-cliq:send', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'zoho-cliq:upload', 'zoho-cliq', 'upload', 'Staff API capability: zoho-cliq:upload', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'zoho-projects:create', 'zoho-projects', 'create', 'Staff API capability: zoho-projects:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'zoho-projects:delete', 'zoho-projects', 'delete', 'Staff API capability: zoho-projects:delete', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'zoho-projects:read', 'zoho-projects', 'read', 'Staff API capability: zoho-projects:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'zoho-projects:update', 'zoho-projects', 'update', 'Staff API capability: zoho-projects:update', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'zoho-workdrive:create', 'zoho-workdrive', 'create', 'Staff API capability: zoho-workdrive:create', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'zoho-workdrive:read', 'zoho-workdrive', 'read', 'Staff API capability: zoho-workdrive:read', NOW());
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), 'zoho-workdrive:upload', 'zoho-workdrive', 'upload', 'Staff API capability: zoho-workdrive:upload', NOW());
INSERT IGNORE INTO role_permissions (role_id, permission_id, granted_at, granted_by)
SELECT r.id, p.id, NOW(), NULL FROM roles r CROSS JOIN permissions p
WHERE r.name IN ('ADMIN', 'SUPERADMIN') AND CONCAT(p.resource, ':', p.action) IN (
  'activity-logs:create',
  'activity-logs:read',
  'apps:create',
  'apps:delete',
  'apps:read',
  'apps:update',
  'architect-quality:create',
  'architect-quality:delete',
  'architect-quality:read',
  'architect-quality:update',
  'architect-snags:create',
  'architect-snags:delete',
  'architect-snags:read',
  'architect-snags:update',
  'architect-visit-stages:create',
  'architect-visit-stages:delete',
  'architect-visit-stages:read',
  'architect-visit-stages:update',
  'auth-google:connect',
  'auth-google:delete',
  'auth-google:read',
  'auth-microsoft:connect',
  'auth-microsoft:delete',
  'auth-microsoft:read',
  'auth-tokens:delete',
  'auth-zoho:connect',
  'auth-zoho:delete',
  'auth-zoho:read',
  'automation:create',
  'automation:delete',
  'automation:execute',
  'automation:read',
  'automation:update',
  'boq-activity:read',
  'boq-catalog:read',
  'boq-templates:create',
  'boq-templates:delete',
  'boq-templates:read',
  'boq-templates:update',
  'boq:approve',
  'boq:create',
  'boq:delete',
  'boq:export',
  'boq:read',
  'boq:submit',
  'boq:update',
  'budget-estimates:create',
  'budget-estimates:delete',
  'budget-estimates:lock',
  'budget-estimates:read',
  'budget-estimates:recalculate',
  'budget-estimates:update',
  'business-proposals:create',
  'business-proposals:read',
  'business-proposals:update',
  'calendar-events:create',
  'calendar-events:delete',
  'calendar-events:read',
  'calendar-events:update',
  'cdn:upload',
  'client-portal:create',
  'client-portal:deliver',
  'client-portal:prepare',
  'client-portal:read',
  'client-portal:revoke',
  'clients:create',
  'clients:delete',
  'clients:read',
  'clients:restore',
  'clients:update',
  'command-center:approve',
  'command-center:complete',
  'command-center:read',
  'command-center:refresh',
  'command-center:review',
  'command-center:upload',
  'dashboard:read',
  'dashboards:read',
  'dashboards:reset',
  'dashboards:update',
  'delivery-challans:create',
  'delivery-challans:delete',
  'delivery-challans:read',
  'delivery-challans:receive',
  'delivery-challans:update',
  'document-requirements:create',
  'document-requirements:delete',
  'document-requirements:read',
  'document-requirements:update',
  'document-types:create',
  'document-types:delete',
  'document-types:read',
  'document-types:update',
  'documents:create',
  'documents:delete',
  'documents:deliver',
  'documents:read',
  'documents:update',
  'dpr-admin-documents:create',
  'dpr-admin-documents:export',
  'dpr-admin-documents:read',
  'dpr-admin-logs:create',
  'dpr-admin-logs:delete',
  'dpr-admin-logs:read',
  'dpr-admin-logs:update',
  'dpr-admin-reports:create',
  'dpr-admin-reports:delete',
  'dpr-admin-reports:export',
  'dpr-admin-reports:read',
  'dpr-admin-reports:update',
  'drawings:create',
  'drawings:delete',
  'drawings:read',
  'drawings:update',
  'gates:clear',
  'gates:create',
  'gates:read',
  'gates:reopen',
  'google-calendar:create',
  'google-calendar:delete',
  'google-calendar:read',
  'google-calendar:update',
  'google-tasks:complete',
  'google-tasks:create',
  'google-tasks:delete',
  'google-tasks:read',
  'google-tasks:update',
  'inventory:adjust',
  'inventory:create',
  'inventory:deliver',
  'inventory:issue',
  'inventory:read',
  'inventory:return',
  'inventory:transfer',
  'leads:create',
  'leads:delete',
  'leads:read',
  'leads:sync',
  'leads:update',
  'library:create',
  'library:delete',
  'library:read',
  'library:update',
  'material-procurement:create',
  'material-procurement:delete',
  'material-procurement:read',
  'material-procurement:submit',
  'material-procurement:update',
  'materials:create',
  'materials:delete',
  'materials:read',
  'materials:update',
  'notes:create',
  'notes:delete',
  'notes:read',
  'notes:update',
  'notifications:delete',
  'notifications:read',
  'notifications:update',
  'onedrive:create',
  'onedrive:delete',
  'onedrive:read',
  'onedrive:update',
  'onedrive:upload',
  'payment-schedules:create',
  'payment-schedules:delete',
  'payment-schedules:read',
  'payment-schedules:update',
  'permissions:create',
  'permissions:delete',
  'permissions:read',
  'permissions:update',
  'phase-definitions:read',
  'plan-of-actions:create',
  'plan-of-actions:delete',
  'plan-of-actions:publish',
  'plan-of-actions:read',
  'plan-of-actions:update',
  'procurement-estimates:approve',
  'procurement-estimates:create',
  'procurement-estimates:read',
  'procurement-estimates:reject',
  'procurement-quotations:accept',
  'procurement-quotations:create',
  'procurement-quotations:read',
  'procurement-quotations:reject',
  'procurement-quotations:send',
  'procurement-rate-sheets:approve',
  'procurement-rate-sheets:create',
  'procurement-rate-sheets:delete',
  'procurement-rate-sheets:read',
  'procurement-rate-sheets:reject',
  'procurement-requirements:create',
  'procurement-requirements:delete',
  'procurement-requirements:read',
  'procurement-requirements:update',
  'procurement-sample-boards:approve',
  'procurement-sample-boards:create',
  'procurement-sample-boards:delete',
  'procurement-sample-boards:read',
  'procurement-sample-boards:reject',
  'project-briefs:create',
  'project-briefs:delete',
  'project-briefs:read',
  'project-briefs:update',
  'project-briefs:upload',
  'project-dashboard:read',
  'project-planners:create',
  'project-planners:delete',
  'project-planners:generate',
  'project-planners:read',
  'project-planners:update',
  'project-shortlists:create',
  'project-shortlists:delete',
  'project-shortlists:export',
  'project-shortlists:read',
  'project-shortlists:update',
  'project-types:create',
  'project-types:delete',
  'project-types:read',
  'project-types:update',
  'projects-phases:create',
  'projects-phases:delete',
  'projects-phases:read',
  'projects-phases:update',
  'projects:create',
  'projects:delete',
  'projects:read',
  'projects:restore',
  'projects:update',
  'purchase-orders:approve',
  'purchase-orders:cancel',
  'purchase-orders:create',
  'purchase-orders:delete',
  'purchase-orders:read',
  'purchase-orders:update',
  'quality-checklists:create',
  'quality-checklists:delete',
  'quality-checklists:export',
  'quality-checklists:read',
  'quality-checklists:update',
  'quotation-items:create',
  'quotation-items:delete',
  'quotation-items:read',
  'quotation-items:update',
  'quotations:approve',
  'quotations:create',
  'quotations:delete',
  'quotations:export',
  'quotations:read',
  'quotations:restore',
  'quotations:select',
  'quotations:submit',
  'quotations:update',
  'rbac:create',
  'rbac:delete',
  'rbac:read',
  'rbac:update',
  'reports:read',
  'role-apps:assign',
  'role-apps:grant',
  'role-apps:read',
  'role-apps:revoke',
  'role-apps:update',
  'role-permissions:assign',
  'role-permissions:grant',
  'role-permissions:read',
  'role-permissions:revoke',
  'scope-of-work:create',
  'scope-of-work:delete',
  'scope-of-work:read',
  'scope-of-work:update',
  'search:read',
  'search:reindex',
  'sessions:read-any',
  'sessions:revoke-any',
  'settings:create',
  'settings:delete',
  'settings:read',
  'settings:update',
  'shortlist-entries:create',
  'shortlist-entries:delete',
  'shortlist-entries:read',
  'shortlist-entries:select',
  'shortlist-entries:update',
  'shortlist-packages:apply',
  'shortlist-packages:create',
  'shortlist-packages:delete',
  'shortlist-packages:read',
  'site-ops-checklists:create',
  'site-ops-checklists:read',
  'site-ops-daily-reports:create',
  'site-ops-daily-reports:delete',
  'site-ops-daily-reports:read',
  'site-ops-daily-reports:share',
  'site-ops-daily-reports:update',
  'site-ops-daily-reports:upload',
  'site-ops-mockups:create',
  'site-ops-mockups:read',
  'site-ops-mockups:update',
  'site-ops-qc:read',
  'site-ops-qc:sign-off',
  'site-ops-rfis:create',
  'site-ops-rfis:read',
  'site-ops-rfis:update',
  'site-ops-snag-lists:create',
  'site-ops-snag-lists:export',
  'site-ops-snag-lists:read',
  'site-ops-snag-lists:update',
  'site-ops-snag-lists:upload',
  'site-ops-visits:assign',
  'site-ops-visits:check-in',
  'site-ops-visits:create',
  'site-ops-visits:read',
  'site-ops-visits:update',
  'site-ops:read',
  'site-recces:create',
  'site-recces:delete',
  'site-recces:read',
  'site-recces:restore',
  'site-recces:update',
  'site-recces:upload',
  'sync:read',
  'sync:sync',
  'sync:update',
  'system:read',
  'tasks:create',
  'tasks:delete',
  'tasks:read',
  'tasks:update',
  'team:create',
  'team:delete',
  'team:read',
  'team:update',
  'terms-templates:create',
  'terms-templates:delete',
  'terms-templates:read',
  'terms-templates:update',
  'units:create',
  'units:delete',
  'units:read',
  'units:update',
  'user-signatures:delete',
  'user-signatures:read',
  'user-signatures:upload',
  'users:create',
  'users:delete',
  'users:read',
  'users:update',
  'vendor-business-types:create',
  'vendor-business-types:read',
  'vendor-categories:read',
  'vendor-rate-comparisons:create',
  'vendor-rate-comparisons:read',
  'vendor-rate-comparisons:update',
  'vendors-saved-searches:create',
  'vendors-saved-searches:delete',
  'vendors-saved-searches:read',
  'vendors:create',
  'vendors:delete',
  'vendors:read',
  'vendors:update',
  'work-orders:approve',
  'work-orders:create',
  'work-orders:delete',
  'work-orders:read',
  'work-orders:reject',
  'work-orders:update',
  'workflow-library:assign',
  'workflow-library:create',
  'workflow-library:delete',
  'workflow-library:deliver',
  'workflow-library:read',
  'workflow-library:update',
  'workflow-progress:create',
  'workflow-progress:read',
  'workflow-progress:sign-off',
  'workflow-progress:update',
  'workflow-timeline:read',
  'workflow:create',
  'workflow:read',
  'workflow:update',
  'workspace:read',
  'zoho-bigin:create',
  'zoho-bigin:delete',
  'zoho-bigin:read',
  'zoho-bigin:update',
  'zoho-calendar:create',
  'zoho-calendar:delete',
  'zoho-calendar:read',
  'zoho-calendar:update',
  'zoho-cliq:read',
  'zoho-cliq:send',
  'zoho-cliq:upload',
  'zoho-projects:create',
  'zoho-projects:delete',
  'zoho-projects:read',
  'zoho-projects:update',
  'zoho-workdrive:create',
  'zoho-workdrive:read',
  'zoho-workdrive:upload'
);
COMMIT;
