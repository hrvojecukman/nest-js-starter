/*
  Warnings:

  - The values [COMMERCIAL_REGISTRATION,TAX_CERTIFICATE,VAL_BROKERAGE_LICENSE,REAL_ESTATE_DEVELOPMENT_LICENSE,OFFICIAL_COMPANY_LOGO] on the enum `DeveloperDocumentType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "DeveloperDocumentType_new" AS ENUM ('commercialRegistration', 'taxCertificate', 'valBrokerageLicense', 'realEstateDevelopmentLicense', 'officialCompanyLogo');
ALTER TABLE "DeveloperDocument" ALTER COLUMN "documentType" TYPE "DeveloperDocumentType_new" USING ("documentType"::text::"DeveloperDocumentType_new");
ALTER TYPE "DeveloperDocumentType" RENAME TO "DeveloperDocumentType_old";
ALTER TYPE "DeveloperDocumentType_new" RENAME TO "DeveloperDocumentType";
DROP TYPE "DeveloperDocumentType_old";
COMMIT;
