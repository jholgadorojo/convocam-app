-- AlterTable
ALTER TABLE "selection_process_documents" ADD COLUMN     "sourceActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "sourceLastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "selection_processes" ADD COLUMN     "sourceActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "sourceLastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
