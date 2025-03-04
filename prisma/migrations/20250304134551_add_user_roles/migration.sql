-- CreateEnum
CREATE TYPE "Role" AS ENUM ('BUYER', 'DEVELOPER', 'OWNER', 'BROKER', 'ADMIN');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'BUYER';

-- CreateTable
CREATE TABLE "Buyer" (
    "user_id" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,

    CONSTRAINT "Buyer_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "Developer" (
    "user_id" TEXT NOT NULL,
    "isLicensed" BOOLEAN NOT NULL,
    "hasWafi" BOOLEAN NOT NULL,
    "acceptsBanks" BOOLEAN NOT NULL,

    CONSTRAINT "Developer_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "Owner" (
    "user_id" TEXT NOT NULL,
    "companyName" TEXT,

    CONSTRAINT "Owner_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "Broker" (
    "user_id" TEXT NOT NULL,
    "isLicensed" BOOLEAN NOT NULL,
    "licenseNumber" TEXT NOT NULL,

    CONSTRAINT "Broker_pkey" PRIMARY KEY ("user_id")
);

-- AddForeignKey
ALTER TABLE "Buyer" ADD CONSTRAINT "Buyer_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Developer" ADD CONSTRAINT "Developer_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Owner" ADD CONSTRAINT "Owner_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Broker" ADD CONSTRAINT "Broker_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
