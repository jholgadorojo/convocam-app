import {
  describe,
  expect,
  it,
} from "vitest";

import { PersonalSelectionProcessStatus } from "./personal-selection-process-status";
import { UserSelectionProcess } from "./user-selection-process";

describe("UserSelectionProcess", () => {
  const initialDate = new Date(
    "2026-10-05T10:00:00.000Z",
  );

  it("crea un seguimiento con estado inicial Me interesa", () => {
    const userSelectionProcess =
      UserSelectionProcess.create(
        {
          userId: "user-123",
          selectionProcessId: 456,
        },
        initialDate,
      );

    expect(
      userSelectionProcess.id,
    ).toBeUndefined();

    expect(
      userSelectionProcess.userId,
    ).toBe("user-123");

    expect(
      userSelectionProcess.selectionProcessId,
    ).toBe(456);

    expect(
      userSelectionProcess.personalStatus,
    ).toBe(
      PersonalSelectionProcessStatus.INTERESTED,
    );

    expect(
      userSelectionProcess.followedAt,
    ).toEqual(initialDate);

    expect(
      userSelectionProcess.personalStatusUpdatedAt,
    ).toEqual(initialDate);

    expect(
      userSelectionProcess.updatedAt,
    ).toEqual(initialDate);
  });

  it("elimina espacios del identificador del usuario", () => {
    const userSelectionProcess =
      UserSelectionProcess.create(
        {
          userId: "  user-123  ",
          selectionProcessId: 456,
        },
        initialDate,
      );

    expect(
      userSelectionProcess.userId,
    ).toBe("user-123");
  });

  it("no permite crear un seguimiento sin usuario", () => {
    expect(() =>
      UserSelectionProcess.create(
        {
          userId: "   ",
          selectionProcessId: 456,
        },
        initialDate,
      ),
    ).toThrow(
      "El identificador del usuario es obligatorio.",
    );
  });

  it("no permite crear un seguimiento con una convocatoria inválida", () => {
    expect(() =>
      UserSelectionProcess.create(
        {
          userId: "user-123",
          selectionProcessId: 0,
        },
        initialDate,
      ),
    ).toThrow(
      "El identificador de la convocatoria debe ser válido.",
    );
  });

  it("cambia el estado personal y actualiza sus fechas", () => {
    const userSelectionProcess =
      UserSelectionProcess.create(
        {
          userId: "user-123",
          selectionProcessId: 456,
        },
        initialDate,
      );

    const statusChangeDate = new Date(
      "2026-10-10T12:00:00.000Z",
    );

    userSelectionProcess.changePersonalStatus(
      PersonalSelectionProcessStatus.APPLICATION_SUBMITTED,
      statusChangeDate,
    );

    expect(
      userSelectionProcess.personalStatus,
    ).toBe(
      PersonalSelectionProcessStatus.APPLICATION_SUBMITTED,
    );

    expect(
      userSelectionProcess.followedAt,
    ).toEqual(initialDate);

    expect(
      userSelectionProcess.personalStatusUpdatedAt,
    ).toEqual(statusChangeDate);

    expect(
      userSelectionProcess.updatedAt,
    ).toEqual(statusChangeDate);
  });

  it("no modifica las fechas si el estado personal no cambia", () => {
    const userSelectionProcess =
      UserSelectionProcess.create(
        {
          userId: "user-123",
          selectionProcessId: 456,
        },
        initialDate,
      );

    const laterDate = new Date(
      "2026-10-10T12:00:00.000Z",
    );

    userSelectionProcess.changePersonalStatus(
      PersonalSelectionProcessStatus.INTERESTED,
      laterDate,
    );

    expect(
      userSelectionProcess.personalStatus,
    ).toBe(
      PersonalSelectionProcessStatus.INTERESTED,
    );

    expect(
      userSelectionProcess.personalStatusUpdatedAt,
    ).toEqual(initialDate);

    expect(
      userSelectionProcess.updatedAt,
    ).toEqual(initialDate);
  });

  it("restaura un seguimiento existente", () => {
    const followedAt = new Date(
      "2026-10-01T08:00:00.000Z",
    );

    const personalStatusUpdatedAt =
      new Date(
        "2026-10-03T09:00:00.000Z",
      );

    const updatedAt = new Date(
      "2026-10-03T09:00:00.000Z",
    );

    const userSelectionProcess =
      UserSelectionProcess.restore({
        id: 10,
        userId: "user-123",
        selectionProcessId: 456,
        personalStatus:
          PersonalSelectionProcessStatus.ADMITTED,
        followedAt,
        personalStatusUpdatedAt,
        updatedAt,
      });

    expect(
      userSelectionProcess.id,
    ).toBe(10);

    expect(
      userSelectionProcess.userId,
    ).toBe("user-123");

    expect(
      userSelectionProcess.selectionProcessId,
    ).toBe(456);

    expect(
      userSelectionProcess.personalStatus,
    ).toBe(
      PersonalSelectionProcessStatus.ADMITTED,
    );

    expect(
      userSelectionProcess.followedAt,
    ).toEqual(followedAt);

    expect(
      userSelectionProcess.personalStatusUpdatedAt,
    ).toEqual(
      personalStatusUpdatedAt,
    );

    expect(
      userSelectionProcess.updatedAt,
    ).toEqual(updatedAt);
  });

  it("no permite restaurar un seguimiento sin identificador válido", () => {
    expect(() =>
      UserSelectionProcess.restore({
        id: 0,
        userId: "user-123",
        selectionProcessId: 456,
        personalStatus:
          PersonalSelectionProcessStatus.INTERESTED,
        followedAt: initialDate,
        personalStatusUpdatedAt:
          initialDate,
        updatedAt: initialDate,
      }),
    ).toThrow(
      "El identificador del seguimiento debe ser válido.",
    );
  });
});