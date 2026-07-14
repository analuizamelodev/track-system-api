-- Remove simple origin/destination columns
ALTER TABLE "Shipment" DROP COLUMN IF EXISTS "origin";
ALTER TABLE "Shipment" DROP COLUMN IF EXISTS "destination";

-- Add service info
ALTER TABLE "Shipment"
  ADD COLUMN IF NOT EXISTS "serviceType"  TEXT NOT NULL DEFAULT 'PADRAO',
  ADD COLUMN IF NOT EXISTS "weight"       DOUBLE PRECISION NOT NULL DEFAULT 0.1,
  ADD COLUMN IF NOT EXISTS "estimatedDelivery" TIMESTAMP(3);

-- Add structured sender/origin fields
ALTER TABLE "Shipment"
  ADD COLUMN IF NOT EXISTS "senderName"          TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "originStreet"        TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "originNumber"        TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "originNeighborhood"  TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "originCity"          TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "originState"         TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "originCep"           TEXT NOT NULL DEFAULT '';

-- Add structured recipient/destination fields
ALTER TABLE "Shipment"
  ADD COLUMN IF NOT EXISTS "recipientName"           TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "destinationStreet"       TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "destinationNumber"       TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "destinationNeighborhood" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "destinationCity"         TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "destinationState"        TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "destinationCep"          TEXT NOT NULL DEFAULT '';

-- Add audit fields to TrackingEvent
ALTER TABLE "TrackingEvent"
  ADD COLUMN IF NOT EXISTS "location"      TEXT,
  ADD COLUMN IF NOT EXISTS "changedById"   TEXT,
  ADD COLUMN IF NOT EXISTS "changedByName" TEXT;

-- Rebuild Recipient for proof of delivery
ALTER TABLE "Recipient" DROP COLUMN IF EXISTS "name";
ALTER TABLE "Recipient" DROP COLUMN IF EXISTS "address";
ALTER TABLE "Recipient"
  ADD COLUMN IF NOT EXISTS "signedName"  TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "deliveryCep" TEXT NOT NULL DEFAULT '';
