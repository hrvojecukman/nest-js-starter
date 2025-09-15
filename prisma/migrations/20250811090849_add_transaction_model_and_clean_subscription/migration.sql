/*
  Warnings:

  - You are about to drop the column `checkoutExpiresAt` on the `Subscription` table. All the data in the column will be lost.
  - You are about to drop the column `externalReference` on the `Subscription` table. All the data in the column will be lost.
  - You are about to drop the column `paymentProvider` on the `Subscription` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('ios', 'android', 'web', 'manual');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('subscription_start', 'subscription_renewal', 'subscription_cancellation', 'one_time_purchase', 'refund', 'credit');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- AlterTable
ALTER TABLE "Subscription" DROP COLUMN "checkoutExpiresAt",
DROP COLUMN "externalReference",
DROP COLUMN "paymentProvider",
ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "metadata" JSONB;

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "TransactionStatus" NOT NULL,
    "externalId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subscriptionId" TEXT,
    "planId" TEXT,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
