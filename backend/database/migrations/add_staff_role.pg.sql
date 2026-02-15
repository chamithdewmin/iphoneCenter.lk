-- Run on existing databases that were created before 'staff' was added.
-- New installs get 'staff' from init.pg.sql. Safe to run multiple times.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'user_role' AND e.enumlabel = 'staff'
  ) THEN
    ALTER TYPE user_role ADD VALUE 'staff';
  END IF;
END;
$$;
