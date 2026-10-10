-- Room area uses the square of the room's measurement_unit (FT, M, IN, CM).
ALTER TABLE site_recce_rooms ADD COLUMN area DECIMAL(12, 2) NULL;
