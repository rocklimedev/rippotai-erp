-- Apply before deploying the updated Site Recce API.
ALTER TABLE site_recce_rooms ADD COLUMN room_type_other VARCHAR(255) NULL;
