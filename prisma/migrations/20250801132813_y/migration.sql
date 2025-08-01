/*
  Warnings:

  - Made the column `lastName` on table `Broker` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Broker" ALTER COLUMN "lastName" SET NOT NULL;
