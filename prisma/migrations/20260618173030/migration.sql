/*
  Warnings:

  - You are about to drop the `TrackingEvent` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "TrackingEvent" DROP CONSTRAINT "TrackingEvent_shipmentId_fkey";

-- DropTable
DROP TABLE "TrackingEvent";
