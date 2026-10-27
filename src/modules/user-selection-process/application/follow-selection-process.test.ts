import {
  describe,
  expect,
  it,
} from "vitest";

import { PersonalSelectionProcessStatus } from "../domain/personal-selection-process-status";
import { UserSelectionProcess } from "../domain/user-selection-process";
import type { UserSelectionProcessRepository } from "../domain/user-selection-process-repository";

import { FollowSelectionProcess } from "./follow-selection-process";

describe("FollowSelectionProcess", () => {
  it("crea el seguimiento con estado inicial Me interesa", async () => {
    const repository =
      new InMemoryUserSelectionProcessRepository();

    const useCase =
      new FollowSelectionProcess(
        repository,
      );

    const result =
      await useCase.execute({
        userId: "user-123",
        selectionProcessId: 456,
      });

    expect(result.id).toBeDefined();

    expect(result.userId).toBe(
      "user-123",
    );

    expect(
      result.selectionProcessId,
    ).toBe(456);

    expect(
      result.personalStatus,
    ).toBe(
      PersonalSelectionProcessStatus.INTERESTED,
    );

    expect(repository.items).toHaveLength(
      1,
    );
  });

  it("devuelve el seguimiento existente sin crear un duplicado", async () => {
    const repository =
      new InMemoryUserSelectionProcessRepository();

    const useCase =
      new FollowSelectionProcess(
        repository,
      );

    const first =
      await useCase.execute({
        userId: "user-123",
        selectionProcessId: 456,
      });

    const second =
      await useCase.execute({
        userId: "user-123",
        selectionProcessId: 456,
      });

    expect(second.id).toBe(first.id);

    expect(repository.items).toHaveLength(
      1,
    );
  });

  it("no reinicia el estado personal si la convocatoria ya estaba seguida", async () => {
    const repository =
      new InMemoryUserSelectionProcessRepository();

    const existing =
      UserSelectionProcess.restore({
        id: 10,
        userId: "user-123",
        selectionProcessId: 456,
        personalStatus:
          PersonalSelectionProcessStatus.APPLICATION_SUBMITTED,
        followedAt: new Date(
          "2026-10-01T08:00:00.000Z",
        ),
        personalStatusUpdatedAt:
          new Date(
            "2026-10-05T08:00:00.000Z",
          ),
        updatedAt: new Date(
          "2026-10-05T08:00:00.000Z",
        ),
      });

    repository.items.push(existing);

    const useCase =
      new FollowSelectionProcess(
        repository,
      );

    const result =
      await useCase.execute({
        userId: "user-123",
        selectionProcessId: 456,
      });

    expect(
      result.personalStatus,
    ).toBe(
      PersonalSelectionProcessStatus.APPLICATION_SUBMITTED,
    );

    expect(
      result.followedAt,
    ).toEqual(
      new Date(
        "2026-10-01T08:00:00.000Z",
      ),
    );

    expect(repository.items).toHaveLength(
      1,
    );
  });

  it("devuelve el seguimiento creado por una petición simultánea (doble clic)", async () => {
    const repository =
      new ConcurrentFollowRepository();

    const useCase =
      new FollowSelectionProcess(
        repository,
      );

    const result =
      await useCase.execute({
        userId: "user-123",
        selectionProcessId: 456,
      });

    expect(result.selectionProcessId).toBe(
      456,
    );

    expect(repository.items).toHaveLength(
      1,
    );
  });

  it("propaga el error si el guardado falla por otro motivo", async () => {
    const repository =
      new InMemoryUserSelectionProcessRepository();

    repository.save = async () => {
      throw new Error("La convocatoria no existe");
    };

    const useCase =
      new FollowSelectionProcess(
        repository,
      );

    await expect(
      useCase.execute({
        userId: "user-123",
        selectionProcessId: 999,
      }),
    ).rejects.toThrow("La convocatoria no existe");
  });
});

class InMemoryUserSelectionProcessRepository
  implements UserSelectionProcessRepository
{
  items: UserSelectionProcess[] = [];

  private nextId = 1;

  async findByUserAndSelectionProcess(
    userId: string,
    selectionProcessId: number,
  ): Promise<UserSelectionProcess | null> {
    return (
      this.items.find(
        (item) =>
          item.userId === userId &&
          item.selectionProcessId ===
            selectionProcessId,
      ) ?? null
    );
  }

  async findByUser(
    userId: string,
  ): Promise<UserSelectionProcess[]> {
    return this.items.filter(
      (item) =>
        item.userId === userId,
    );
  }

  async save(
    userSelectionProcess:
      UserSelectionProcess,
  ): Promise<UserSelectionProcess> {
    if (
      userSelectionProcess.id ===
      undefined
    ) {
      const persisted =
        UserSelectionProcess.restore({
          id: this.nextId++,
          userId:
            userSelectionProcess.userId,
          selectionProcessId:
            userSelectionProcess.selectionProcessId,
          personalStatus:
            userSelectionProcess.personalStatus,
          followedAt:
            userSelectionProcess.followedAt,
          personalStatusUpdatedAt:
            userSelectionProcess.personalStatusUpdatedAt,
          updatedAt:
            userSelectionProcess.updatedAt,
        });

      this.items.push(persisted);

      return persisted;
    }

    const index =
      this.items.findIndex(
        (item) =>
          item.id ===
          userSelectionProcess.id,
      );

    if (index >= 0) {
      this.items[index] =
        userSelectionProcess;
    }

    return userSelectionProcess;
  }

  async deleteByUserAndSelectionProcess(
    userId: string,
    selectionProcessId: number,
  ): Promise<void> {
    this.items = this.items.filter(
      (item) =>
        !(
          item.userId === userId &&
          item.selectionProcessId ===
            selectionProcessId
        ),
    );
  }
}
/**
 * Simula el doble clic: otra petición crea el seguimiento
 * justo después de la búsqueda inicial, así que el guardado
 * falla por la restricción única.
 */
class ConcurrentFollowRepository extends InMemoryUserSelectionProcessRepository {
  async save(
    userSelectionProcess:
      UserSelectionProcess,
  ): Promise<UserSelectionProcess> {
    await super.save(userSelectionProcess);

    throw new Error("Unique constraint failed");
  }
}
