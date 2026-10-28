import { Prisma, type PrismaClient } from "@/generated/prisma/client";

import type { UserSelectionProcessRepository } from "../../domain/user-selection-process-repository";
import { SelectionProcessNotFoundError } from "../../domain/selection-process-not-found-error";
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
      try {
        const row =
          await this.prisma.userSelectionProcess.create(
            {
              data: persistence,
            },
          );

        return UserSelectionProcessMapper.toDomain(
          row,
        );
      } catch (error) {
        // P2003: falla la clave foránea, la convocatoria no existe.
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2003"
        ) {
          throw new SelectionProcessNotFoundError();
        }

        throw error;
      }
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
    // deleteMany no falla si el seguimiento ya no existe
    // (p. ej. doble clic en «Dejar de seguir»).
    await this.prisma.userSelectionProcess.deleteMany(
      {
        where: {
          userId,
          selectionProcessId,
        },
      },
    );
  }
}