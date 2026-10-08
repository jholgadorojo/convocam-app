import type { PrismaClient } from "@/generated/prisma/client";

import type { UserSelectionProcessRepository } from "../../domain/user-selection-process-repository";
import type { UserSelectionProcess } from "../../domain/user-selection-process";

import { UserSelectionProcessMapper } from "./user-selection-process-mapper";

export class PrismaUserSelectionProcessRepository
  implements UserSelectionProcessRepository
{
  constructor(
    private readonly prisma: PrismaClient,
  ) {}

  async findByUserAndSelectionProcess(
    userId: string,
    selectionProcessId: number,
  ): Promise<UserSelectionProcess | null> {
    const row =
      await this.prisma.userSelectionProcess.findUnique(
        {
          where: {
            userId_selectionProcessId: {
              userId,
              selectionProcessId,
            },
          },
        },
      );

    if (!row) {
      return null;
    }

    return UserSelectionProcessMapper.toDomain(
      row,
    );
  }

  async findByUser(
    userId: string,
  ): Promise<UserSelectionProcess[]> {
    const rows =
      await this.prisma.userSelectionProcess.findMany(
        {
          where: {
            userId,
          },
        },
      );

    return rows.map((row) =>
      UserSelectionProcessMapper.toDomain(
        row,
      ),
    );
  }

  async save(
    userSelectionProcess: UserSelectionProcess,
  ): Promise<UserSelectionProcess> {
    const persistence =
      UserSelectionProcessMapper.toPersistence(
        userSelectionProcess,
      );

    if (
      userSelectionProcess.id ===
      undefined
    ) {
      const row =
        await this.prisma.userSelectionProcess.create(
          {
            data: persistence,
          },
        );

      return UserSelectionProcessMapper.toDomain(
        row,
      );
    }

    const row =
      await this.prisma.userSelectionProcess.update(
        {
          where: {
            id: userSelectionProcess.id,
          },
          data: {
            personalStatus:
              persistence.personalStatus,
            personalStatusUpdatedAt:
              persistence.personalStatusUpdatedAt,
          },
        },
      );

    return UserSelectionProcessMapper.toDomain(
      row,
    );
  }

  async deleteByUserAndSelectionProcess(
    userId: string,
    selectionProcessId: number,
  ): Promise<void> {
    await this.prisma.userSelectionProcess.delete(
      {
        where: {
          userId_selectionProcessId: {
            userId,
            selectionProcessId,
          },
        },
      },
    );
  }
}