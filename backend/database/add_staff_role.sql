-- ============================================
-- Add 'staff' to user_role enum if missing
-- (Some databases were created before 'staff' was in the enum.)
-- Run: psql "$DATABASE_URL" -f add_staff_role.sql
-- ============================================

-- 1. Check current enum values
SELECT 'Current user_role enum values:' AS info;
SELECT enumlabel
  FROM pg_enum e
  JOIN pg_type t ON e.enumtypid = t.oid
 WHERE t.typname = 'user_role'
 ORDER BY e.enumsortorder;

-- 2. Add 'staff' if it does not exist (safe to run multiple times)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_enum e
      JOIN pg_type t ON e.enumtypid = t.oid
     WHERE t.typname = 'user_role'
       AND e.enumlabel = 'staff'
  ) THEN
    ALTER TYPE user_role ADD VALUE 'staff';
    RAISE NOTICE 'Added value staff to user_role enum';
  ELSE
    RAISE NOTICE 'user_role already has staff - no change';
  END IF;
END
$$;

-- 3. Verify
SELECT 'user_role enum after update:' AS info;
SELECT enumlabel
  FROM pg_enum e
  JOIN pg_type t ON t.oid = e.enumtypid
 WHERE t.typname = 'user_role'
 ORDER BY e.enumsortorder;
