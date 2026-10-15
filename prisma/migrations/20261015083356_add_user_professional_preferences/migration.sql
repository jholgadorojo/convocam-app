-- CreateEnum
CREATE TYPE "PreferredSelectionProcessType" AS ENUM ('POSITIONS', 'JOB_POOLS', 'BOTH');

-- CreateTable
CREATE TABLE "user_professional_preferences" (
    "id" SERIAL NOT NULL,
    "userProfileId" INTEGER NOT NULL,
    "selectionProcessType" "PreferredSelectionProcessType",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_professional_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_preferred_subject_areas" (
    "professionalPreferenceId" INTEGER NOT NULL,
    "subjectAreaId" INTEGER NOT NULL,

    CONSTRAINT "user_preferred_subject_areas_pkey" PRIMARY KEY ("professionalPreferenceId","subjectAreaId")
);

-- CreateTable
CREATE TABLE "user_preferred_qualification_groups" (
    "professionalPreferenceId" INTEGER NOT NULL,
    "qualificationGroup" TEXT NOT NULL,

    CONSTRAINT "user_preferred_qualification_groups_pkey" PRIMARY KEY ("professionalPreferenceId","qualificationGroup")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_professional_preferences_userProfileId_key" ON "user_professional_preferences"("userProfileId");

-- CreateIndex
CREATE INDEX "user_preferred_subject_areas_subjectAreaId_idx" ON "user_preferred_subject_areas"("subjectAreaId");

-- CreateIndex
CREATE INDEX "user_preferred_qualification_groups_qualificationGroup_idx" ON "user_preferred_qualification_groups"("qualificationGroup");

-- AddForeignKey
ALTER TABLE "user_professional_preferences" ADD CONSTRAINT "user_professional_preferences_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferred_subject_areas" ADD CONSTRAINT "user_preferred_subject_areas_professionalPreferenceId_fkey" FOREIGN KEY ("professionalPreferenceId") REFERENCES "user_professional_preferences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferred_subject_areas" ADD CONSTRAINT "user_preferred_subject_areas_subjectAreaId_fkey" FOREIGN KEY ("subjectAreaId") REFERENCES "subject_areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferred_qualification_groups" ADD CONSTRAINT "user_preferred_qualification_groups_professionalPreference_fkey" FOREIGN KEY ("professionalPreferenceId") REFERENCES "user_professional_preferences"("id") ON DELETE CASCADE ON UPDATE CASCADE;
