/*
  Warnings:

  - Made the column `licenseNumber` on table `Broker` required. This step will fail if there are existing NULL values in that column.
  - Made the column `expectedNumberOfAdsPerMonth` on table `Broker` required. This step will fail if there are existing NULL values in that column.
  - Made the column `hasExecutedSalesTransaction` on table `Broker` required. This step will fail if there are existing NULL values in that column.
  - Made the column `useDigitalPromotion` on table `Broker` required. This step will fail if there are existing NULL values in that column.
  - Made the column `wantsAdvertising` on table `Broker` required. This step will fail if there are existing NULL values in that column.

*/

-- First, update NULL values in Broker table
UPDATE "Broker" SET 
  "licenseNumber" = 'DEFAULT123' WHERE "licenseNumber" IS NULL;

UPDATE "Broker" SET 
  "expectedNumberOfAdsPerMonth" = 5 WHERE "expectedNumberOfAdsPerMonth" IS NULL;

UPDATE "Broker" SET 
  "hasExecutedSalesTransaction" = false WHERE "hasExecutedSalesTransaction" IS NULL;

UPDATE "Broker" SET 
  "useDigitalPromotion" = false WHERE "useDigitalPromotion" IS NULL;

UPDATE "Broker" SET 
  "wantsAdvertising" = false WHERE "wantsAdvertising" IS NULL;

-- Now make the fields required
-- AlterTable
ALTER TABLE "Broker" ALTER COLUMN "licenseNumber" SET NOT NULL,
ALTER COLUMN "expectedNumberOfAdsPerMonth" SET NOT NULL,
ALTER COLUMN "hasExecutedSalesTransaction" SET NOT NULL,
ALTER COLUMN "useDigitalPromotion" SET NOT NULL,
ALTER COLUMN "wantsAdvertising" SET NOT NULL;
