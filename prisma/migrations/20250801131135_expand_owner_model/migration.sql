-- AlterTable
ALTER TABLE "Owner" ADD COLUMN     "developerPartnership" INTEGER,
ADD COLUMN     "doesOwnProperty" BOOLEAN,
ADD COLUMN     "doesOwnPropertyWithElectronicDeed" BOOLEAN,
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "lookingForDeveloperPartnership" BOOLEAN,
ADD COLUMN     "propertyType" "PropertyType",
ADD COLUMN     "purposeOfRegistration" INTEGER;
