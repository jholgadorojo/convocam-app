import type { PrismaClient } from "@/generated/prisma/client";

import type { SubjectAreaRepository } from "../../application/subject-area-repository";
import type { SubjectAreaSyncData } from "../../application/subject-area-sync-data";

export class PrismaSubjectAreaRepository
  implements SubjectAreaRepository
{
  constructor(
    private readonly prisma: PrismaClient,
  ) {}

  async upsert(
    data: SubjectAreaSyncData,
  ): Promise<number> {
    const subjectArea =
      await this.prisma.subjectArea.upsert({
        where: {
          cidoId: data.cidoId,
        },

        create: {
          ...data,
        },

        update: {
          ...data,
        },

        select: {
          id: true,
        },
      });

    return subjectArea.id;
  }
}