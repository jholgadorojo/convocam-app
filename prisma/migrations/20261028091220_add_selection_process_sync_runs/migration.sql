-- CreateEnum
CREATE TYPE "SelectionProcessSyncRunStatus" AS ENUM ('RUNNING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "selection_process_sync_runs" (
    "id" SERIAL NOT NULL,
    "status" "SelectionProcessSyncRunStatus" NOT NULL DEFAULT 'RUNNING',
    "runningLock" BOOLEAN DEFAULT true,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "result" JSONB,
    "error" TEXT,

    CONSTRAINT "selection_process_sync_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "selection_process_sync_runs_runningLock_key" ON "selection_process_sync_runs"("runningLock");

-- CreateIndex
CREATE INDEX "selection_process_sync_runs_startedAt_idx" ON "selection_process_sync_runs"("startedAt");
