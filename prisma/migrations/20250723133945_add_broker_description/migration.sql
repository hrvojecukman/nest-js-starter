/*
  Warnings:

  - You are about to drop the column `name` on the `Buyer` table. All the data in the column will be lost.
  - Added the required column `locationLat` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `locationLng` to the `Project` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Broker" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "Buyer" DROP COLUMN "name";

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "locationLat" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "locationLng" DOUBLE PRECISION NOT NULL;
