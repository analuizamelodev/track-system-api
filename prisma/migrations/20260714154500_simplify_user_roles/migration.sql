-- Normalize legacy roles: MANAGER(2), OPERATOR(3), DRIVER(4) → OPERATOR(2)
-- ADMIN(1) stays as-is
UPDATE "User" SET "role" = 2 WHERE "role" IN (2, 3, 4) AND "role" <> 1;

ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 2;
