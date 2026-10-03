-- Phase library typo: "SITE PREPRATION" -> "Site preparation" (PMC module; used by plans of action and planners).
UPDATE project_phases SET title = 'Site preparation' WHERE title = 'SITE PREPRATION';
