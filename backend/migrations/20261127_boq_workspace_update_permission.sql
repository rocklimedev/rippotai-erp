-- Match the existing UPDATE_BOQ capability to the BOQ API permission key.
-- Keep the original permission ID and role assignments.
UPDATE permissions
SET resource = 'boq', action = 'update'
WHERE LOWER(resource) = 'boq'
  AND LOWER(action) = 'update'
  AND (BINARY resource <> BINARY 'boq' OR BINARY action <> BINARY 'update');
