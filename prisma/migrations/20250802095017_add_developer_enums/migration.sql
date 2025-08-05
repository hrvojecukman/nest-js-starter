/*
  Warnings:

  - Changed the type of `entityType` on the `Developer` table. No cast exists, the column would be dropped and recreated, which cannot be done since the column is required and there is data in the table.
  - Changed the type of `annualProjectCount` on the `Developer` table. No cast exists, the column would be dropped and recreated, which cannot be done since the column is required and there is data in the table.
  - Changed the type of `totalNumberOfUnits` on the `Developer` table. No cast exists, the column would be dropped and recreated, which cannot be done since the column is required and there is data in the table.

*/

-- CreateEnum
CREATE TYPE "AnnualProjectCount" AS ENUM ('from1To4', 'from5To9', 'moreThan10');

-- CreateEnum
CREATE TYPE "TotalNumberOfUnits" AS ENUM ('from1To15', 'from16To30', 'moreThan30');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('company', 'institution');

-- First, add new columns with the enum types
ALTER TABLE "Developer" ADD COLUMN "entityType_new" "EntityType";
ALTER TABLE "Developer" ADD COLUMN "annualProjectCount_new" "AnnualProjectCount";
ALTER TABLE "Developer" ADD COLUMN "totalNumberOfUnits_new" "TotalNumberOfUnits";

-- Update existing data with appropriate enum values
UPDATE "Developer" SET 
  "entityType_new" = CASE 
    WHEN "entityType" = 'company' THEN 'company'::"EntityType"
    WHEN "entityType" = 'institution' THEN 'institution'::"EntityType"
    ELSE 'company'::"EntityType"
  END,
  "annualProjectCount_new" = CASE 
    WHEN "annualProjectCount" <= 4 THEN 'from1To4'::"AnnualProjectCount"
    WHEN "annualProjectCount" <= 9 THEN 'from5To9'::"AnnualProjectCount"
    ELSE 'moreThan10'::"AnnualProjectCount"
  END,
  "totalNumberOfUnits_new" = CASE 
    WHEN "totalNumberOfUnits" <= 15 THEN 'from1To15'::"TotalNumberOfUnits"
    WHEN "totalNumberOfUnits" <= 30 THEN 'from16To30'::"TotalNumberOfUnits"
    ELSE 'moreThan30'::"TotalNumberOfUnits"
  END;

-- Drop old columns
ALTER TABLE "Developer" DROP COLUMN "entityType";
ALTER TABLE "Developer" DROP COLUMN "annualProjectCount";
ALTER TABLE "Developer" DROP COLUMN "totalNumberOfUnits";

-- Rename new columns to original names
ALTER TABLE "Developer" RENAME COLUMN "entityType_new" TO "entityType";
ALTER TABLE "Developer" RENAME COLUMN "annualProjectCount_new" TO "annualProjectCount";
ALTER TABLE "Developer" RENAME COLUMN "totalNumberOfUnits_new" TO "totalNumberOfUnits";

-- Make the columns NOT NULL
ALTER TABLE "Developer" ALTER COLUMN "entityType" SET NOT NULL;
ALTER TABLE "Developer" ALTER COLUMN "annualProjectCount" SET NOT NULL;
ALTER TABLE "Developer" ALTER COLUMN "totalNumberOfUnits" SET NOT NULL;
