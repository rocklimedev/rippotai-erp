-- Apply before deploying the scoped RBAC code. Back up the database first.
ALTER TABLE roles ADD COLUMN scope ENUM('INTERNAL', 'PROJECT') NOT NULL DEFAULT 'INTERNAL';
SET @role_name_index = (
  SELECT INDEX_NAME FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'roles' AND NON_UNIQUE = 0 AND INDEX_NAME <> 'PRIMARY'
  GROUP BY INDEX_NAME HAVING GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) = 'name' LIMIT 1
);
SET @drop_name_index = IF(@role_name_index IS NULL, 'SELECT 1', CONCAT('ALTER TABLE roles DROP INDEX `', REPLACE(@role_name_index, '`', '``'), '`'));
PREPARE role_index_stmt FROM @drop_name_index;
EXECUTE role_index_stmt;
DEALLOCATE PREPARE role_index_stmt;
ALTER TABLE roles ADD UNIQUE KEY uk_roles_scope_name (scope, name);
ALTER TABLE team_members MODIFY team_id CHAR(36) NULL;

-- Canonical internal memberships have no owner. Preserve existing project labels.
UPDATE team_members SET owner_type = NULL, owner_id = NULL WHERE owner_type = 'TEAM';
UPDATE team_members SET team_id = NULL WHERE owner_type IS NOT NULL AND owner_id IS NOT NULL;

-- Deliberately create project roles without copying any internal privileges.
INSERT INTO roles (id, name, scope, created_at, updated_at)
SELECT UUID(), labels.role_label, 'PROJECT', NOW(), NOW()
FROM (SELECT DISTINCT role_label FROM team_members
      WHERE owner_type IS NOT NULL AND role_label IS NOT NULL
        AND CHAR_LENGTH(role_label) BETWEEN 1 AND 50) labels;

ALTER TABLE team_members
  ADD CONSTRAINT ck_team_members_scope CHECK (
    (team_id IS NOT NULL AND owner_type IS NULL AND owner_id IS NULL) OR
    (team_id IS NULL AND owner_type IS NOT NULL AND owner_id IS NOT NULL)
  ),
  ADD COLUMN active_assignment_key VARCHAR(255) GENERATED ALWAYS AS (
    CASE WHEN deleted_at IS NOT NULL THEN NULL
      WHEN owner_type IS NULL THEN CONCAT('INTERNAL:', team_id, ':', user_id)
      ELSE CONCAT(owner_type, ':', owner_id, ':', user_id, ':', COALESCE(role_label, ''))
    END
  ) VIRTUAL,
  ADD UNIQUE KEY uk_team_members_active_assignment (active_assignment_key);

CREATE TABLE access_rules (
  id CHAR(36) NOT NULL PRIMARY KEY,
  subject_type ENUM('USER', 'ROLE') NOT NULL,
  subject_id CHAR(36) NOT NULL,
  resource VARCHAR(255) NOT NULL,
  action VARCHAR(50) NOT NULL,
  effect ENUM('ALLOW', 'DENY') NOT NULL,
  created_by CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_access_subject (subject_type, subject_id)
);

-- Review this result and configure PROJECT roles and their permissions before rollout.
-- Matching is by role label; unknown labels intentionally have no project access.
SELECT DISTINCT role_label FROM team_members
WHERE owner_type IS NOT NULL AND deleted_at IS NULL;
