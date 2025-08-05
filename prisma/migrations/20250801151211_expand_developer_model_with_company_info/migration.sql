/*
  Warnings:

  - Added the required column `annualProjectCount` to the `Developer` table without a default value. There are 3 rows in this table, it is not possible to execute this step.
  - Added the required column `companyName` to the `Developer` table without a default value. There are 3 rows in this table, it is not possible to execute this step.
  - Added the required column `developerCity` to the `Developer` table without a default value. There are 3 rows in this table, it is not possible to execute this step.
  - Added the required column `entityType` to the `Developer` table without a default value. There are 3 rows in this table, it is not possible to execute this step.
  - Added the required column `propertyType` to the `Developer` table without a default value. There are 3 rows in this table, it is not possible to execute this step.
  - Added the required column `representativeEmail` to the `Developer` table without a default value. There are 3 rows in this table, it is not possible to execute this step.
  - Added the required column `representativeName` to the `Developer` table without a default value. There are 3 rows in this table, it is not possible to execute this step.
  - Added the required column `representativePhone` to the `Developer` table without a default value. There are 3 rows in this table, it is not possible to execute this step.
  - Added the required column `representativePosition` to the `Developer` table without a default value. There are 3 rows in this table, it is not possible to execute this step.
  - Added the required column `totalNumberOfUnits` to the `Developer` table without a default value. There are 3 rows in this table, it is not possible to execute this step.

*/

-- CreateEnum
CREATE TYPE "DeveloperDocumentType" AS ENUM ('COMMERCIAL_REGISTRATION', 'TAX_CERTIFICATE', 'VAL_BROKERAGE_LICENSE', 'REAL_ESTATE_DEVELOPMENT_LICENSE', 'OFFICIAL_COMPANY_LOGO');

-- CreateTable
CREATE TABLE "DeveloperDocument" (
    "id" TEXT NOT NULL,
    "developerId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "documentType" "DeveloperDocumentType" NOT NULL,

    CONSTRAINT "DeveloperDocument_pkey" PRIMARY KEY ("id")
);

-- Add columns with default values
ALTER TABLE "Developer" ADD COLUMN "companyName" TEXT NOT NULL DEFAULT 'Default Company Name';
ALTER TABLE "Developer" ADD COLUMN "entityType" TEXT NOT NULL DEFAULT 'company';
ALTER TABLE "Developer" ADD COLUMN "developerCity" TEXT NOT NULL DEFAULT 'Default City';
ALTER TABLE "Developer" ADD COLUMN "propertyType" "PropertyType" NOT NULL DEFAULT 'residential';
ALTER TABLE "Developer" ADD COLUMN "annualProjectCount" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Developer" ADD COLUMN "totalNumberOfUnits" INTEGER NOT NULL DEFAULT 10;
ALTER TABLE "Developer" ADD COLUMN "representativeName" TEXT NOT NULL DEFAULT 'Default Representative';
ALTER TABLE "Developer" ADD COLUMN "representativePhone" TEXT NOT NULL DEFAULT '+1234567890';
ALTER TABLE "Developer" ADD COLUMN "representativePosition" TEXT NOT NULL DEFAULT 'CEO';
ALTER TABLE "Developer" ADD COLUMN "representativeEmail" TEXT NOT NULL DEFAULT 'default@example.com';
ALTER TABLE "Developer" ADD COLUMN "websiteUrl" TEXT;
ALTER TABLE "Developer" ADD COLUMN "xAccountUrl" TEXT;
ALTER TABLE "Developer" ADD COLUMN "snapchatAccountUrl" TEXT;
ALTER TABLE "Developer" ADD COLUMN "linkedinAccountUrl" TEXT;

-- Update existing records with more realistic data
UPDATE "Developer" SET 
  "companyName" = 'Default Development Company',
  "entityType" = 'company',
  "developerCity" = 'Riyadh',
  "propertyType" = 'residential',
  "annualProjectCount" = 5,
  "totalNumberOfUnits" = 100,
  "representativeName" = 'Default CEO',
  "representativePhone" = '+966501234567',
  "representativePosition" = 'CEO',
  "representativeEmail" = 'ceo@defaultcompany.com'
WHERE "companyName" = 'Default Company Name';

-- Remove default constraints
ALTER TABLE "Developer" ALTER COLUMN "companyName" DROP DEFAULT;
ALTER TABLE "Developer" ALTER COLUMN "entityType" DROP DEFAULT;
ALTER TABLE "Developer" ALTER COLUMN "developerCity" DROP DEFAULT;
ALTER TABLE "Developer" ALTER COLUMN "propertyType" DROP DEFAULT;
ALTER TABLE "Developer" ALTER COLUMN "annualProjectCount" DROP DEFAULT;
ALTER TABLE "Developer" ALTER COLUMN "totalNumberOfUnits" DROP DEFAULT;
ALTER TABLE "Developer" ALTER COLUMN "representativeName" DROP DEFAULT;
ALTER TABLE "Developer" ALTER COLUMN "representativePhone" DROP DEFAULT;
ALTER TABLE "Developer" ALTER COLUMN "representativePosition" DROP DEFAULT;
ALTER TABLE "Developer" ALTER COLUMN "representativeEmail" DROP DEFAULT;

-- Make existing fields optional
ALTER TABLE "Developer" ALTER COLUMN "hasWafi" DROP NOT NULL;
ALTER TABLE "Developer" ALTER COLUMN "acceptsBanks" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "DeveloperDocument" ADD CONSTRAINT "DeveloperDocument_developerId_fkey" FOREIGN KEY ("developerId") REFERENCES "Developer"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeveloperDocument" ADD CONSTRAINT "DeveloperDocument_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex
CREATE UNIQUE INDEX "DeveloperDocument_developerId_mediaId_key" ON "DeveloperDocument"("developerId", "mediaId");
