-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "s2L12" VARCHAR(32),
ADD COLUMN     "s2L16" VARCHAR(32);

-- CreateIndex
CREATE INDEX "Property_s2L12_idx" ON "Property"("s2L12");

-- CreateIndex
CREATE INDEX "Property_s2L16_idx" ON "Property"("s2L16");
