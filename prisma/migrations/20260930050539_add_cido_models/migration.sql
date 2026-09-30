-- CreateTable
CREATE TABLE "institutions" (
    "id" SERIAL NOT NULL,
    "cidoId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "ineCode" TEXT,
    "address" TEXT,
    "postalCode" TEXT,
    "municipality" TEXT,
    "countyCode" TEXT,
    "county" TEXT,
    "provinceCode" TEXT,
    "province" TEXT,
    "contractorProfileUrl" TEXT,
    "socCode" TEXT,
    "sepeCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "institutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "selection_processes" (
    "id" SERIAL NOT NULL,
    "cidoId" TEXT NOT NULL,
    "cidoIdentifier" TEXT NOT NULL,
    "fileNumber" TEXT,
    "publicOfferYear" INTEGER,
    "title" TEXT NOT NULL,
    "isJobPool" BOOLEAN NOT NULL,
    "scopeId" INTEGER NOT NULL,
    "scopeName" TEXT NOT NULL,
    "institutionName" TEXT NOT NULL,
    "institutionId" INTEGER,
    "applicationStartDate" DATE,
    "applicationEndDate" DATE,
    "applicationEndTime" TEXT,
    "applicationDeadlineNotes" TEXT,
    "selectionSystemId" INTEGER,
    "selectionSystem" TEXT,
    "personnelTypeId" INTEGER,
    "personnelType" TEXT,
    "qualificationGroupId" INTEGER,
    "qualificationGroup" TEXT,
    "requiredQualification" TEXT,
    "otherRequirements" TEXT,
    "numberOfPositions" INTEGER,
    "reservedDisabilityPositions" INTEGER,
    "reservedUnemployed" BOOLEAN NOT NULL,
    "reservedYoung" BOOLEAN NOT NULL,
    "reservedWomen" BOOLEAN NOT NULL,
    "firstExamDate" DATE,
    "observations" TEXT,
    "institutionUrl" TEXT,
    "applicationUrl" TEXT,
    "cidoUrl" TEXT NOT NULL,
    "statusId" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "lastDocumentPublicationDate" DATE,
    "sourceSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sourceHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "selection_processes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "selection_process_documents" (
    "id" SERIAL NOT NULL,
    "cidoId" TEXT NOT NULL,
    "selectionProcessId" INTEGER NOT NULL,
    "publicationDate" DATE NOT NULL,
    "summary" TEXT NOT NULL,
    "publisher" TEXT,
    "bulletinId" INTEGER NOT NULL,
    "bulletin" TEXT NOT NULL,
    "bulletinNumber" INTEGER,
    "entryDate" DATE NOT NULL,
    "phaseId" INTEGER NOT NULL,
    "phase" TEXT NOT NULL,
    "phaseNotes" TEXT,
    "documentUrl" TEXT NOT NULL,
    "htmlUrl" TEXT,
    "sourceSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sourceHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "selection_process_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subject_areas" (
    "id" SERIAL NOT NULL,
    "cidoId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cidoModuleId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subject_areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "selection_process_subject_areas" (
    "selectionProcessId" INTEGER NOT NULL,
    "subjectAreaId" INTEGER NOT NULL,

    CONSTRAINT "selection_process_subject_areas_pkey" PRIMARY KEY ("selectionProcessId","subjectAreaId")
);

-- CreateIndex
CREATE UNIQUE INDEX "institutions_cidoId_key" ON "institutions"("cidoId");

-- CreateIndex
CREATE INDEX "institutions_municipality_idx" ON "institutions"("municipality");

-- CreateIndex
CREATE INDEX "institutions_county_idx" ON "institutions"("county");

-- CreateIndex
CREATE INDEX "institutions_province_idx" ON "institutions"("province");

-- CreateIndex
CREATE UNIQUE INDEX "selection_processes_cidoId_key" ON "selection_processes"("cidoId");

-- CreateIndex
CREATE UNIQUE INDEX "selection_processes_cidoIdentifier_key" ON "selection_processes"("cidoIdentifier");

-- CreateIndex
CREATE INDEX "selection_processes_institutionId_idx" ON "selection_processes"("institutionId");

-- CreateIndex
CREATE INDEX "selection_processes_statusId_idx" ON "selection_processes"("statusId");

-- CreateIndex
CREATE INDEX "selection_processes_isJobPool_idx" ON "selection_processes"("isJobPool");

-- CreateIndex
CREATE INDEX "selection_processes_scopeId_idx" ON "selection_processes"("scopeId");

-- CreateIndex
CREATE INDEX "selection_processes_qualificationGroupId_idx" ON "selection_processes"("qualificationGroupId");

-- CreateIndex
CREATE INDEX "selection_processes_applicationEndDate_idx" ON "selection_processes"("applicationEndDate");

-- CreateIndex
CREATE UNIQUE INDEX "selection_process_documents_cidoId_key" ON "selection_process_documents"("cidoId");

-- CreateIndex
CREATE INDEX "selection_process_documents_selectionProcessId_idx" ON "selection_process_documents"("selectionProcessId");

-- CreateIndex
CREATE INDEX "selection_process_documents_publicationDate_idx" ON "selection_process_documents"("publicationDate");

-- CreateIndex
CREATE INDEX "selection_process_documents_phaseId_idx" ON "selection_process_documents"("phaseId");

-- CreateIndex
CREATE UNIQUE INDEX "subject_areas_cidoId_key" ON "subject_areas"("cidoId");

-- CreateIndex
CREATE INDEX "selection_process_subject_areas_subjectAreaId_idx" ON "selection_process_subject_areas"("subjectAreaId");

-- AddForeignKey
ALTER TABLE "selection_processes" ADD CONSTRAINT "selection_processes_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "selection_process_documents" ADD CONSTRAINT "selection_process_documents_selectionProcessId_fkey" FOREIGN KEY ("selectionProcessId") REFERENCES "selection_processes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "selection_process_subject_areas" ADD CONSTRAINT "selection_process_subject_areas_selectionProcessId_fkey" FOREIGN KEY ("selectionProcessId") REFERENCES "selection_processes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "selection_process_subject_areas" ADD CONSTRAINT "selection_process_subject_areas_subjectAreaId_fkey" FOREIGN KEY ("subjectAreaId") REFERENCES "subject_areas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
