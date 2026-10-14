-- CreateEnum
CREATE TYPE "TerritorialPreferenceScope" AS ENUM ('ALL_CATALONIA', 'SELECTED_TERRITORIES');

-- CreateTable
CREATE TABLE "user_territorial_preferences" (
    "id" SERIAL NOT NULL,
    "userProfileId" INTEGER NOT NULL,
    "scope" "TerritorialPreferenceScope" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_territorial_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_preferred_provinces" (
    "territorialPreferenceId" INTEGER NOT NULL,
    "provinceId" INTEGER NOT NULL,

    CONSTRAINT "user_preferred_provinces_pkey" PRIMARY KEY ("territorialPreferenceId","provinceId")
);

-- CreateTable
CREATE TABLE "user_preferred_counties" (
    "territorialPreferenceId" INTEGER NOT NULL,
    "countyId" INTEGER NOT NULL,

    CONSTRAINT "user_preferred_counties_pkey" PRIMARY KEY ("territorialPreferenceId","countyId")
);

-- CreateTable
CREATE TABLE "user_preferred_municipalities" (
    "territorialPreferenceId" INTEGER NOT NULL,
    "municipalityId" INTEGER NOT NULL,

    CONSTRAINT "user_preferred_municipalities_pkey" PRIMARY KEY ("territorialPreferenceId","municipalityId")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_territorial_preferences_userProfileId_key" ON "user_territorial_preferences"("userProfileId");

-- CreateIndex
CREATE INDEX "user_preferred_provinces_provinceId_idx" ON "user_preferred_provinces"("provinceId");

-- CreateIndex
CREATE INDEX "user_preferred_counties_countyId_idx" ON "user_preferred_counties"("countyId");

-- CreateIndex
CREATE INDEX "user_preferred_municipalities_municipalityId_idx" ON "user_preferred_municipalities"("municipalityId");

-- AddForeignKey
ALTER TABLE "user_territorial_preferences" ADD CONSTRAINT "user_territorial_preferences_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferred_provinces" ADD CONSTRAINT "user_preferred_provinces_territorialPreferenceId_fkey" FOREIGN KEY ("territorialPreferenceId") REFERENCES "user_territorial_preferences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferred_provinces" ADD CONSTRAINT "user_preferred_provinces_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "provinces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferred_counties" ADD CONSTRAINT "user_preferred_counties_territorialPreferenceId_fkey" FOREIGN KEY ("territorialPreferenceId") REFERENCES "user_territorial_preferences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferred_counties" ADD CONSTRAINT "user_preferred_counties_countyId_fkey" FOREIGN KEY ("countyId") REFERENCES "counties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferred_municipalities" ADD CONSTRAINT "user_preferred_municipalities_territorialPreferenceId_fkey" FOREIGN KEY ("territorialPreferenceId") REFERENCES "user_territorial_preferences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferred_municipalities" ADD CONSTRAINT "user_preferred_municipalities_municipalityId_fkey" FOREIGN KEY ("municipalityId") REFERENCES "municipalities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
