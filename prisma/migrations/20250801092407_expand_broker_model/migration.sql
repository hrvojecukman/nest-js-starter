-- AlterEnum
ALTER TYPE "PropertyType" ADD VALUE 'residentialAndCommercial';

-- AlterTable
ALTER TABLE "Broker" ADD COLUMN     "email" TEXT,
ADD COLUMN     "expectedNumberOfAdsPerMonth" INTEGER,
ADD COLUMN     "hasExecutedSalesTransaction" BOOLEAN,
ADD COLUMN     "typeOfProperties" "PropertyType"[],
ADD COLUMN     "useDigitalPromotion" BOOLEAN,
ADD COLUMN     "wantsAdvertising" BOOLEAN;
