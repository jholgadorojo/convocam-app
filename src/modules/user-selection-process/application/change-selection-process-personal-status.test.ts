import {
  describe,
  expect,
  it,
} from "vitest";

import { PersonalSelectionProcessStatus } from "../domain/personal-selection-process-status";
import { UserSelectionProcess } from "../domain/user-selection-process";
import type { UserSelectionProcessRepository } from "../domain/user-selection-process-repository";

import { ChangeSelectionProcessPersonalStatus } from "./change-selection-process-personal-status";

describe(
  "ChangeSelectionProcessPersonalStatus",
  () => {
    it(
      "cambia el estado personal de una convocatoria seguida",
      async () => {
        const initialDate = new Date(
          "2026-10-01T08:00:00.000Z",
        );

        const statusChangeDate =
          new Date(
            "2026-10-08T10:00:00.000Z",
          );

        const repository =
          new InMemoryUserSelectionProcessRepository();

        repository.items.push(
          UserSelectionProcess.restore({
            id: 1,
            userId: "user-123",
            selectionProcessId: 456,
            personalStatus:
              PersonalSelectionProcessStatus.INTERESTED,
            followedAt: initialDate,
            personalStatusUpdatedAt:
              initialDate,
            updatedAt: initialDate,
          }),
        );

        const useCase =
          new ChangeSelectionProcessPersonalStatus(
            repository,
            () => statusChangeDate,
          );

        const result =
          await useCase.execute({
            userId: "user-123",
            selectionProcessId: 456,
            personalStatus:
              PersonalSelectionProcessStatus.APPLICATION_SUBMITTED,
          });

        expect(
          result.personalStatus,
        ).toBe(
          PersonalSelectionProcessStatus.APPLICATION_SUBMITTED,
        );

        expect(
          result.personalStatusUpdatedAt,
        ).toEqual(statusChangeDate);

        expect(result.followedAt).toEqual(
          initialDate,
        );

        expect(
          repository.saveCalls,
        ).toBe(1);
      },
    );

    it(
      "no modifica ni guarda si el estado ya es el mismo",
      async () => {
        const initialDate = new Date(
          "2026-10-01T08:00:00.000Z",
        );

        const repository =
          new InMemoryUserSelectionProcessRepository();

        repository.items.push(
          UserSelectionProcess.restore({
            id: 1,
            userId: "user-123",
            selectionProcessId: 456,
            personalStatus:
              PersonalSelectionProcessStatus.INTERESTED,
            followedAt: initialDate,
            personalStatusUpdatedAt:
              initialDate,
            updatedAt: initialDate,
          }),
        );

        const useCase =
          new ChangeSelectionProcessPersonalStatus(
            repository,
            () =>
              new Date(
                "2026-10-08T10:00:00.000Z",
              ),
          );

        const result =
          await useCase.execute({
            userId: "user-123",
            selectionProcessId: 456,
            personalStatus:
              PersonalSelectionProcessStatus.INTERESTED,
          });

        expect(
          result.personalStatusUpdatedAt,
        ).toEqual(initialDate);

        expect(result.updatedAt).toEqual(
          initialDate,
        );

        expect(
          repository.saveCalls,
        ).toBe(0);
      },
    );

    it(
      "lanza un error si la convocatoria no está en seguimiento",
      async () => {
        const repository =
          new InMemoryUserSelectionProcessRepository();

        const useCase =
          new ChangeSelectionProcessPersonalStatus(
            repository,
          );

        await expect(
          useCase.execute({
            userId: "user-123",
            selectionProcessId: 456,
            personalStatus:
              PersonalSelectionProcessStatus.ADMITTED,
          }),
        ).rejects.toThrow(
          "La convocatoria no está en seguimiento.",
        );

        expect(
          repository.saveCalls,
        ).toBe(0);
      },
    );
  },
);

class InMemoryUserSelectionProcessRepository
  implements UserSelectionProcessRepository
{
  items: UserSelectionProcess[] = [];

  saveCalls = 0;

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
    this.saveCalls += 1;

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