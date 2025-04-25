-- CreateEnum
CREATE TYPE "Role" AS ENUM ('BUYER', 'DEVELOPER', 'OWNER', 'BROKER', 'ADMIN');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('residential', 'commercial');

-- CreateEnum
CREATE TYPE "PropertyCategory" AS ENUM ('palace', 'villa', 'duplex', 'singleStoryHouse', 'apartment', 'land');

-- CreateEnum
CREATE TYPE "UnitStatus" AS ENUM ('available', 'sold', 'rented');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('video', 'virtualTour', 'threeD', 'photo');

-- CreateEnum
CREATE TYPE "InfrastructureItem" AS ENUM ('waterNetwork', 'sewageSystem', 'electricityNetwork', 'fiberOptics', 'parking', 'elevator', 'fiberOpticExtension', 'basement', 'insulationBlock', 'pool', 'playground');

-- CreateEnum
CREATE TYPE "FacingDirection" AS ENUM ('north', 'south', 'east', 'west', 'northEast', 'northWest', 'southEast', 'southWest');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "phoneNumber" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'BUYER',
    "stripeCustomerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Buyer" (
    "user_id" TEXT NOT NULL,
    "name" TEXT,
    "lastName" TEXT,

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

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL,
    "stripePaymentIntentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL,
    "downPaymentPercentage" INTEGER NOT NULL,
    "cashBackPercentage" INTEGER,
    "cityDis" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "space" INTEGER NOT NULL,
    "numberOfLivingRooms" INTEGER NOT NULL,
    "numberOfRooms" INTEGER NOT NULL,
    "numberOfKitchen" INTEGER NOT NULL,
    "numberOfWC" INTEGER NOT NULL,
    "numberOfFloors" INTEGER NOT NULL,
    "streetWidth" INTEGER NOT NULL,
    "age" INTEGER NOT NULL,
    "facing" "FacingDirection" NOT NULL,
    "type" "PropertyType" NOT NULL,
    "category" "PropertyCategory" NOT NULL,
    "unitStatus" "UnitStatus" NOT NULL,
    "infrastructureItems" "InfrastructureItem"[],
    "locationLat" DOUBLE PRECISION NOT NULL,
    "locationLng" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerId" TEXT NOT NULL,
    "brokerId" TEXT,
    "projectId" TEXT,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyMedia" (
    "id" TEXT NOT NULL,
    "type" "MediaType" NOT NULL,
    "url" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PropertyMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phoneNumber_key" ON "User"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "User_phoneNumber_idx" ON "User"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_stripePaymentIntentId_key" ON "Payment"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "Property_locationLat_locationLng_idx" ON "Property"("locationLat", "locationLng");

-- CreateIndex
CREATE INDEX "PropertyMedia_propertyId_idx" ON "PropertyMedia"("propertyId");

-- AddForeignKey
ALTER TABLE "Buyer" ADD CONSTRAINT "Buyer_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Developer" ADD CONSTRAINT "Developer_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Owner" ADD CONSTRAINT "Owner_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Broker" ADD CONSTRAINT "Broker_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyMedia" ADD CONSTRAINT "PropertyMedia_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
