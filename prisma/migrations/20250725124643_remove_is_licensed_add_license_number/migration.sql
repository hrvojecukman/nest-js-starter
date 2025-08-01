/*
  Warnings:

  - You are about to drop the column `isLicensed` on the `Broker` table. All the data in the column will be lost.
  - You are about to drop the column `companyName` on the `Developer` table. All the data in the column will be lost.
  - You are about to drop the column `isLicensed` on the `Developer` table. All the data in the column will be lost.
  - You are about to drop the column `companyName` on the `Owner` table. All the data in the column will be lost.
  - Made the column `name` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Broker" DROP COLUMN "isLicensed",
ALTER COLUMN "licenseNumber" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Developer" DROP COLUMN "companyName",
DROP COLUMN "isLicensed",
ADD COLUMN     "licenseNumber" TEXT;

-- AlterTable
ALTER TABLE "Owner" DROP COLUMN "companyName";

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "name" SET NOT NULL;
