-- CreateEnum
CREATE TYPE "AcademicQualificationType" AS ENUM ('PRIMARY', 'SCHOOL_GRADUATE', 'ESO', 'BACCALAUREATE', 'VOCATIONAL_BASIC', 'VOCATIONAL_INTERMEDIATE', 'VOCATIONAL_HIGHER', 'UNIVERSITY_DIPLOMA', 'UNIVERSITY_DEGREE', 'UNIVERSITY_LICENTIATE', 'UNIVERSITY_MASTER', 'DOCTORATE', 'OTHER');

-- CreateTable
CREATE TABLE "user_academic_qualifications" (
    "id" SERIAL NOT NULL,
    "userProfileId" INTEGER NOT NULL,
    "qualificationType" "AcademicQualificationType" NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_academic_qualifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_academic_qualifications_userProfileId_idx" ON "user_academic_qualifications"("userProfileId");

-- AddForeignKey
ALTER TABLE "user_academic_qualifications" ADD CONSTRAINT "user_academic_qualifications_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
