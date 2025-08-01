-- AlterTable
ALTER TABLE "Broker" ALTER COLUMN "licenseNumber" DROP NOT NULL,
ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "expectedNumberOfAdsPerMonth" DROP NOT NULL,
ALTER COLUMN "hasExecutedSalesTransaction" DROP NOT NULL,
ALTER COLUMN "useDigitalPromotion" DROP NOT NULL,
ALTER COLUMN "wantsAdvertising" DROP NOT NULL,
ALTER COLUMN "lastName" DROP NOT NULL;
