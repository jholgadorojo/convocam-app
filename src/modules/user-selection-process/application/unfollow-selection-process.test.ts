import {
  describe,
  expect,
  it,
} from "vitest";

import { PersonalSelectionProcessStatus } from "../domain/personal-selection-process-status";
import { UserSelectionProcess } from "../domain/user-selection-process";
import type { UserSelectionProcessRepository } from "../domain/user-selection-process-repository";

import { UnfollowSelectionProcess } from "./unfollow-selection-process";

describe("UnfollowSelectionProcess", () => {
  it("elimina el seguimiento existente", async () => {
    const repository =
      new InMemoryUserSelectionProcessRepository();

    repository.items.push(
      UserSelectionProcess.restore({
        id: 1,
        userId: "user-123",
        selectionProcessId: 456,
        personalStatus:
          PersonalSelectionProcessStatus.INTERESTED,
        followedAt: new Date(
          "2026-10-01T08:00:00.000Z",
        ),
        personalStatusUpdatedAt:
          new Date(
            "2026-10-01T08:00:00.000Z",
          ),
        updatedAt: new Date(
          "2026-10-01T08:00:00.000Z",
        ),
      }),
    );

    const useCase =
      new UnfollowSelectionProcess(
        repository,
      );

    await useCase.execute({
      userId: "user-123",
      selectionProcessId: 456,
    });

    expect(repository.items).toHaveLength(
      0,
    );
  });

  it("no falla si el seguimiento no existe", async () => {
    const repository =
      new InMemoryUserSelectionProcessRepository();

    const useCase =
      new UnfollowSelectionProcess(
        repository,
      );

    await expect(
      useCase.execute({
        userId: "user-123",
        selectionProcessId: 456,
      }),
    ).resolves.toBeUndefined();

    expect(repository.items).toHaveLength(
      0,
    );
  });
});

class InMemoryUserSelectionProcessRepository
  implements UserSelectionProcessRepository
{
  items: UserSelectionProcess[] = [];

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