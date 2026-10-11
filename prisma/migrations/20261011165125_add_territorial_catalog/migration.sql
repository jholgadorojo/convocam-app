-- AlterTable
ALTER TABLE "user_profiles" ADD COLUMN     "residenceMunicipalityId" INTEGER;

-- CreateTable
CREATE TABLE "provinces" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "provinces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "counties" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "counties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "municipalities" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "countyId" INTEGER NOT NULL,
    "provinceId" INTEGER NOT NULL,

    CONSTRAINT "municipalities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "provinces_code_key" ON "provinces"("code");

-- CreateIndex
CREATE UNIQUE INDEX "counties_code_key" ON "counties"("code");

-- CreateIndex
CREATE UNIQUE INDEX "municipalities_code_key" ON "municipalities"("code");

-- CreateIndex
CREATE INDEX "municipalities_countyId_idx" ON "municipalities"("countyId");

-- CreateIndex
CREATE INDEX "municipalities_provinceId_idx" ON "municipalities"("provinceId");

-- CreateIndex
CREATE INDEX "user_profiles_residenceMunicipalityId_idx" ON "user_profiles"("residenceMunicipalityId");

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_residenceMunicipalityId_fkey" FOREIGN KEY ("residenceMunicipalityId") REFERENCES "municipalities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "municipalities" ADD CONSTRAINT "municipalities_countyId_fkey" FOREIGN KEY ("countyId") REFERENCES "counties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "municipalities" ADD CONSTRAINT "municipalities_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "provinces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
