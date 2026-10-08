-- CreateEnum
CREATE TYPE "PersonalSelectionProcessStatus" AS ENUM ('INTERESTED', 'PREPARING_APPLICATION', 'APPLICATION_SUBMITTED', 'ADMITTED', 'EXCLUDED', 'EXAM_PENDING', 'EXAM_COMPLETED', 'COMPLETED');

-- CreateTable
CREATE TABLE "user_selection_processes" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "selection_process_id" INTEGER NOT NULL,
    "personal_status" "PersonalSelectionProcessStatus" NOT NULL DEFAULT 'INTERESTED',
    "followed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "personal_status_updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_selection_processes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_selection_processes_selection_process_id_idx" ON "user_selection_processes"("selection_process_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_selection_processes_user_id_selection_process_id_key" ON "user_selection_processes"("user_id", "selection_process_id");

-- AddForeignKey
ALTER TABLE "user_selection_processes" ADD CONSTRAINT "user_selection_processes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_selection_processes" ADD CONSTRAINT "user_selection_processes_selection_process_id_fkey" FOREIGN KEY ("selection_process_id") REFERENCES "selection_processes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
