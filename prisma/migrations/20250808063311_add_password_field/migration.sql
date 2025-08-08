/*
  Warnings:

  - The values [tap,paypal] on the enum `PaymentProvider` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PaymentProvider_new" AS ENUM ('stripe', 'manual', 'unknown');
ALTER TABLE "Subscription" ALTER COLUMN "paymentProvider" TYPE "PaymentProvider_new" USING ("paymentProvider"::text::"PaymentProvider_new");
ALTER TYPE "PaymentProvider" RENAME TO "PaymentProvider_old";
ALTER TYPE "PaymentProvider_new" RENAME TO "PaymentProvider";
DROP TYPE "PaymentProvider_old";
COMMIT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "password" TEXT;

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");
