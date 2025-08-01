/*
  Warnings:

  - Added the required column `propertyType` to the `Broker` table without a default value. There are 18 rows in this table, it is not possible to execute this step.
  - You are about to drop the column `typeOfProperties` on the `Broker` table, which still contains 15 non-null values.

*/

-- First, add the new column with a default value
ALTER TABLE "Broker" ADD COLUMN "propertyType" "PropertyType" NOT NULL DEFAULT 'residential';

-- Update existing records to use the first value from the array (or default)
UPDATE "Broker" SET "propertyType" = 'residential' WHERE "propertyType" IS NULL;

-- Now drop the old column
ALTER TABLE "Broker" DROP COLUMN "typeOfProperties";
