import {
  describe,
  expect,
  it,
} from "vitest";

import {
  PersonalSelectionProcessStatus as PrismaPersonalSelectionProcessStatus,
  type UserSelectionProcess as PrismaUserSelectionProcess,
} from "@/generated/prisma/client";

import { PersonalSelectionProcessStatus } from "../../domain/personal-selection-process-status";
import { UserSelectionProcess } from "../../domain/user-selection-process";
import { UserSelectionProcessMapper } from "./user-selection-process-mapper";

describe("UserSelectionProcessMapper", () => {
  it("convierte una fila Prisma a una entidad de dominio", () => {
    const row: PrismaUserSelectionProcess = {
      id: 10,
      userId: "user-123",
      selectionProcessId: 456,
      personalStatus:
        PrismaPersonalSelectionProcessStatus.ADMITTED,
      followedAt: new Date(
        "2026-10-01T10:00:00.000Z",
      ),
      personalStatusUpdatedAt: new Date(
        "2026-10-05T10:00:00.000Z",
      ),
      updatedAt: new Date(
        "2026-10-05T10:00:00.000Z",
      ),
    };

    const entity =
      UserSelectionProcessMapper.toDomain(
        row,
      );

    expect(entity.id).toBe(10);
    expect(entity.userId).toBe("user-123");
    expect(
      entity.selectionProcessId,
    ).toBe(456);

    expect(entity.personalStatus).toBe(
      PersonalSelectionProcessStatus.ADMITTED,
    );

    expect(entity.followedAt).toEqual(
      row.followedAt,
    );

    expect(
      entity.personalStatusUpdatedAt,
    ).toEqual(
      row.personalStatusUpdatedAt,
    );

    expect(entity.updatedAt).toEqual(
      row.updatedAt,
    );
  });

  it("convierte una entidad de dominio a datos persistibles por Prisma", () => {
    const followedAt = new Date(
      "2026-10-01T10:00:00.000Z",
    );

    const entity =
      UserSelectionProcess.create(
        {
          userId: "user-123",
          selectionProcessId: 456,
        },
        followedAt,
      );

    const statusUpdatedAt = new Date(
      "2026-10-05T10:00:00.000Z",
    );

    entity.changePersonalStatus(
      PersonalSelectionProcessStatus.APPLICATION_SUBMITTED,
      statusUpdatedAt,
    );

    const persistence =
      UserSelectionProcessMapper.toPersistence(
        entity,
      );

    expect(persistence).toEqual({
      userId: "user-123",
      selectionProcessId: 456,
      personalStatus:
        PrismaPersonalSelectionProcessStatus.APPLICATION_SUBMITTED,
      followedAt,
      personalStatusUpdatedAt:
        statusUpdatedAt,
    });
  });
});