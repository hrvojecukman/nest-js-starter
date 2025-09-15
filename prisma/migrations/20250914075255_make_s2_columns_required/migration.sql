/*
  Warnings:

  - Made the column `s2L12` on table `Property` required. This step will fail if there are existing NULL values in that column.
  - Made the column `s2L16` on table `Property` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Property" ALTER COLUMN "s2L12" SET NOT NULL,
ALTER COLUMN "s2L16" SET NOT NULL;
