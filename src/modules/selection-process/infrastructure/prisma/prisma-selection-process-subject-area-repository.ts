import type { PrismaClient } from "@/generated/prisma/client";

import type { SelectionProcessSubjectAreaRepository } from "../../application/selection-process-subject-area-repository";

export class PrismaSelectionProcessSubjectAreaRepository
  implements SelectionProcessSubjectAreaRepository
{
  constructor(
    private readonly prisma: PrismaClient,
  ) {}

  async replaceAll(
    selectionProcessId: number,
    subjectAreaIds: number[],
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.selectionProcessSubjectArea.deleteMany({
        where: {
          selectionProcessId,
        },
      });

      if (subjectAreaIds.length === 0) {
        return;
      }

      await tx.selectionProcessSubjectArea.createMany({
        data: subjectAreaIds.map(
          (subjectAreaId) => ({
            selectionProcessId,
            subjectAreaId,
          }),
        ),
        skipDuplicates: true,
      });
    });
  }
}