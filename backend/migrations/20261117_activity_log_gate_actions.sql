-- Add gate activity actions without removing or reordering existing enum values.
-- Re-runnable on MySQL / MariaDB. DDL implicitly commits.
SET @activity_action_type = (
  SELECT COLUMN_TYPE FROM information_schema.columns
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'activity_logs' AND COLUMN_NAME = 'action'
);
SET @activity_action_type = IF(
  LOCATE('''gate_cleared''', @activity_action_type) > 0,
  @activity_action_type,
  CONCAT(LEFT(@activity_action_type, CHAR_LENGTH(@activity_action_type) - 1), ',''gate_cleared'')')
);
SET @activity_action_type = IF(
  LOCATE('''gate_overridden''', @activity_action_type) > 0,
  @activity_action_type,
  CONCAT(LEFT(@activity_action_type, CHAR_LENGTH(@activity_action_type) - 1), ',''gate_overridden'')')
);
SET @activity_action_type = IF(
  LOCATE('''gate_reopened''', @activity_action_type) > 0,
  @activity_action_type,
  CONCAT(LEFT(@activity_action_type, CHAR_LENGTH(@activity_action_type) - 1), ',''gate_reopened'')')
);
SET @activity_action_type = IF(
  LOCATE('''gate_manual_condition_ticked''', @activity_action_type) > 0,
  @activity_action_type,
  CONCAT(LEFT(@activity_action_type, CHAR_LENGTH(@activity_action_type) - 1), ',''gate_manual_condition_ticked'')')
);
SET @activity_action_ddl = CONCAT('ALTER TABLE activity_logs MODIFY COLUMN action ', @activity_action_type, ' NOT NULL');
PREPARE activity_action_statement FROM @activity_action_ddl;
EXECUTE activity_action_statement;
DEALLOCATE PREPARE activity_action_statement;
