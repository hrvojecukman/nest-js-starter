/*
  Warnings:

  - Made the column `licenseNumber` on table `Broker` required. This step will fail if there are existing NULL values in that column.
  - Made the column `description` on table `Broker` required. This step will fail if there are existing NULL values in that column.
  - Made the column `expectedNumberOfAdsPerMonth` on table `Broker` required. This step will fail if there are existing NULL values in that column.
  - Made the column `hasExecutedSalesTransaction` on table `Broker` required. This step will fail if there are existing NULL values in that column.
  - Made the column `useDigitalPromotion` on table `Broker` required. This step will fail if there are existing NULL values in that column.
  - Made the column `wantsAdvertising` on table `Broker` required. This step will fail if there are existing NULL values in that column.
  - Made the column `lastName` on table `Broker` required. This step will fail if there are existing NULL values in that column.
  - Made the column `developerPartnership` on table `Owner` required. This step will fail if there are existing NULL values in that column.
  - Made the column `doesOwnProperty` on table `Owner` required. This step will fail if there are existing NULL values in that column.
  - Made the column `doesOwnPropertyWithElectronicDeed` on table `Owner` required. This step will fail if there are existing NULL values in that column.
  - Made the column `lastName` on table `Owner` required. This step will fail if there are existing NULL values in that column.
  - Made the column `lookingForDeveloperPartnership` on table `Owner` required. This step will fail if there are existing NULL values in that column.
  - Made the column `propertyType` on table `Owner` required. This step will fail if there are existing NULL values in that column.
  - Made the column `purposeOfRegistration` on table `Owner` required. This step will fail if there are existing NULL values in that column.

*/

-- First, update NULL values in Broker table
UPDATE "Broker" SET 
  "lastName" = 'Default Last Name' WHERE "lastName" IS NULL;

UPDATE "Broker" SET 
  "licenseNumber" = 'DEFAULT123' WHERE "licenseNumber" IS NULL;

UPDATE "Broker" SET 
  "description" = 'Default broker description' WHERE "description" IS NULL;

UPDATE "Broker" SET 
  "expectedNumberOfAdsPerMonth" = 5 WHERE "expectedNumberOfAdsPerMonth" IS NULL;

UPDATE "Broker" SET 
  "hasExecutedSalesTransaction" = false WHERE "hasExecutedSalesTransaction" IS NULL;

UPDATE "Broker" SET 
  "useDigitalPromotion" = false WHERE "useDigitalPromotion" IS NULL;

UPDATE "Broker" SET 
  "wantsAdvertising" = false WHERE "wantsAdvertising" IS NULL;

-- Update NULL values in Owner table
UPDATE "Owner" SET 
  "lastName" = 'Default Last Name' WHERE "lastName" IS NULL;

UPDATE "Owner" SET 
  "doesOwnProperty" = false WHERE "doesOwnProperty" IS NULL;

UPDATE "Owner" SET 
  "propertyType" = 'residential' WHERE "propertyType" IS NULL;

UPDATE "Owner" SET 
  "doesOwnPropertyWithElectronicDeed" = false WHERE "doesOwnPropertyWithElectronicDeed" IS NULL;

UPDATE "Owner" SET 
  "purposeOfRegistration" = 1 WHERE "purposeOfRegistration" IS NULL;

UPDATE "Owner" SET 
  "developerPartnership" = 1 WHERE "developerPartnership" IS NULL;

UPDATE "Owner" SET 
  "lookingForDeveloperPartnership" = false WHERE "lookingForDeveloperPartnership" IS NULL;

-- Now make the fields required
-- AlterTable
ALTER TABLE "Broker" ALTER COLUMN "licenseNumber" SET NOT NULL,
ALTER COLUMN "description" SET NOT NULL,
ALTER COLUMN "expectedNumberOfAdsPerMonth" SET NOT NULL,
ALTER COLUMN "hasExecutedSalesTransaction" SET NOT NULL,
ALTER COLUMN "useDigitalPromotion" SET NOT NULL,
ALTER COLUMN "wantsAdvertising" SET NOT NULL,
ALTER COLUMN "lastName" SET NOT NULL;

-- AlterTable
ALTER TABLE "Owner" ALTER COLUMN "developerPartnership" SET NOT NULL,
ALTER COLUMN "doesOwnProperty" SET NOT NULL,
ALTER COLUMN "doesOwnPropertyWithElectronicDeed" SET NOT NULL,
ALTER COLUMN "lastName" SET NOT NULL,
ALTER COLUMN "lookingForDeveloperPartnership" SET NOT NULL,
ALTER COLUMN "propertyType" SET NOT NULL,
ALTER COLUMN "purposeOfRegistration" SET NOT NULL;
