import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import { prisma } from "@/shared/infrastructure/database/prisma";

import { PersonalSelectionProcessStatus } from "../../domain/personal-selection-process-status";
import { UserSelectionProcess } from "../../domain/user-selection-process";
import { SELECTION_PROCESS_NOT_FOUND_ERROR } from "../../domain/user-selection-process-repository";
import { PrismaUserSelectionProcessRepository } from "./prisma-user-selection-process-repository";

const TEST_USER_ID =
  "user-selection-process-test-user";

const TEST_USER_EMAIL =
  "user-selection-process-test@example.com";

const TEST_SELECTION_PROCESS_CIDO_ID =
  "user-selection-process-test-cido";

const TEST_SELECTION_PROCESS_IDENTIFIER =
  "USER-SELECTION-PROCESS-TEST";

const TEST_SELECTION_PROCESS_2_CIDO_ID =
  "user-selection-process-test-cido-2";

const TEST_SELECTION_PROCESS_2_IDENTIFIER =
  "USER-SELECTION-PROCESS-TEST-2";

describe(
  "PrismaUserSelectionProcessRepository",
  () => {
    const repository =
      new PrismaUserSelectionProcessRepository(
        prisma,
      );

    let selectionProcessId: number;
    let secondSelectionProcessId: number;

    beforeEach(async () => {
      await cleanTestData();

      await prisma.user.create({
        data: {
          id: TEST_USER_ID,
          name: "Usuario Test",
          email: TEST_USER_EMAIL,
        },
      });

      const selectionProcess =
        await prisma.selectionProcess.create({
          data: {
            cidoId:
              TEST_SELECTION_PROCESS_CIDO_ID,
            cidoIdentifier:
              TEST_SELECTION_PROCESS_IDENTIFIER,
            title:
              "Convocatoria de prueba",
            isJobPool: false,
            scopeId: 1,
            scopeName:
              "Administración local",
            institutionName:
              "Ayuntamiento de prueba",
            reservedUnemployed: false,
            reservedYoung: false,
            reservedWomen: false,
            cidoUrl:
              "https://example.com/convocatoria-test",
            statusId: 1,
            status: "Abierto",
          },
        });

      const secondSelectionProcess =
        await prisma.selectionProcess.create({
          data: {
            cidoId:
              TEST_SELECTION_PROCESS_2_CIDO_ID,
            cidoIdentifier:
              TEST_SELECTION_PROCESS_2_IDENTIFIER,
            title:
              "Segunda convocatoria de prueba",
            isJobPool: true,
            scopeId: 1,
            scopeName:
              "Administración local",
            institutionName:
              "Ayuntamiento de prueba",
            reservedUnemployed: false,
            reservedYoung: false,
            reservedWomen: false,
            cidoUrl:
              "https://example.com/convocatoria-test-2",
            statusId: 1,
            status: "Abierto",
          },
        });

      selectionProcessId =
        selectionProcess.id;

      secondSelectionProcessId =
        secondSelectionProcess.id;
    });

    afterEach(async () => {
      await cleanTestData();
    });

    it(
      "guarda un nuevo seguimiento",
      async () => {
        const followedAt = new Date(
          "2026-10-08T08:00:00.000Z",
        );

        const entity =
          UserSelectionProcess.create(
            {
              userId: TEST_USER_ID,
              selectionProcessId,
            },
            followedAt,
          );

        const saved =
          await repository.save(entity);

        expect(saved.id).toBeDefined();

        expect(saved.userId).toBe(
          TEST_USER_ID,
        );

        expect(
          saved.selectionProcessId,
        ).toBe(selectionProcessId);

        expect(saved.personalStatus).toBe(
          PersonalSelectionProcessStatus.INTERESTED,
        );

        expect(saved.followedAt).toEqual(
          followedAt,
        );
      },
    );

    it(
      "busca un seguimiento por usuario y convocatoria",
      async () => {
        const entity =
          UserSelectionProcess.create({
            userId: TEST_USER_ID,
            selectionProcessId,
          });

        await repository.save(entity);

        const found =
          await repository.findByUserAndSelectionProcess(
            TEST_USER_ID,
            selectionProcessId,
          );

        expect(found).not.toBeNull();

        expect(found?.userId).toBe(
          TEST_USER_ID,
        );

        expect(
          found?.selectionProcessId,
        ).toBe(selectionProcessId);
      },
    );

    it(
      "devuelve null si el usuario no sigue la convocatoria",
      async () => {
        const found =
          await repository.findByUserAndSelectionProcess(
            TEST_USER_ID,
            selectionProcessId,
          );

        expect(found).toBeNull();
      },
    );

    it(
      "obtiene todos los seguimientos de un usuario",
      async () => {
        await repository.save(
          UserSelectionProcess.create({
            userId: TEST_USER_ID,
            selectionProcessId,
          }),
        );

        await repository.save(
          UserSelectionProcess.create({
            userId: TEST_USER_ID,
            selectionProcessId:
              secondSelectionProcessId,
          }),
        );

        const results =
          await repository.findByUser(
            TEST_USER_ID,
          );

        expect(results).toHaveLength(2);

        expect(
          results.map(
            (item) =>
              item.selectionProcessId,
          ),
        ).toEqual(
          expect.arrayContaining([
            selectionProcessId,
            secondSelectionProcessId,
          ]),
        );
      },
    );

    it(
      "actualiza el estado personal de un seguimiento existente",
      async () => {
        const followedAt = new Date(
          "2026-10-01T08:00:00.000Z",
        );

        const created =
          await repository.save(
            UserSelectionProcess.create(
              {
                userId: TEST_USER_ID,
                selectionProcessId,
              },
              followedAt,
            ),
          );

        const statusUpdatedAt =
          new Date(
            "2026-10-08T09:00:00.000Z",
          );

        created.changePersonalStatus(
          PersonalSelectionProcessStatus.APPLICATION_SUBMITTED,
          statusUpdatedAt,
        );

        const updated =
          await repository.save(created);

        expect(
          updated.personalStatus,
        ).toBe(
          PersonalSelectionProcessStatus.APPLICATION_SUBMITTED,
        );

        expect(
          updated.personalStatusUpdatedAt,
        ).toEqual(statusUpdatedAt);

        expect(
          updated.followedAt,
        ).toEqual(followedAt);
      },
    );

    it(
      "elimina un seguimiento por usuario y convocatoria",
      async () => {
        await repository.save(
          UserSelectionProcess.create({
            userId: TEST_USER_ID,
            selectionProcessId,
          }),
        );

        await repository.deleteByUserAndSelectionProcess(
          TEST_USER_ID,
          selectionProcessId,
        );

        const found =
          await repository.findByUserAndSelectionProcess(
            TEST_USER_ID,
            selectionProcessId,
          );

        expect(found).toBeNull();
      },
    );

    it(
      "no permite guardar dos seguimientos iguales para el mismo usuario y convocatoria",
      async () => {
        await repository.save(
          UserSelectionProcess.create({
            userId: TEST_USER_ID,
            selectionProcessId,
          }),
        );

        const duplicate =
          UserSelectionProcess.create({
            userId: TEST_USER_ID,
            selectionProcessId,
          });

        await expect(
          repository.save(duplicate),
        ).rejects.toMatchObject({
          code: "P2002",
        });
      },
    );

    it(
      "lanza un error de dominio si la convocatoria no existe",
      async () => {
        const entity =
          UserSelectionProcess.create({
            userId: TEST_USER_ID,
            selectionProcessId: 2147483000,
          });

        await expect(
          repository.save(entity),
        ).rejects.toThrow(
          SELECTION_PROCESS_NOT_FOUND_ERROR,
        );
      },
    );

    it(
      "no falla al eliminar un seguimiento que ya no existe",
      async () => {
        await repository.save(
          UserSelectionProcess.create({
            userId: TEST_USER_ID,
            selectionProcessId,
          }),
        );

        await repository.deleteByUserAndSelectionProcess(
          TEST_USER_ID,
          selectionProcessId,
        );

        await expect(
          repository.deleteByUserAndSelectionProcess(
            TEST_USER_ID,
            selectionProcessId,
          ),
        ).resolves.toBeUndefined();
      },
    );
  },
);

async function cleanTestData() {
  await prisma.userSelectionProcess.deleteMany(
    {
      where: {
        userId: TEST_USER_ID,
      },
    },
  );

  await prisma.selectionProcess.deleteMany({
    where: {
      cidoId: {
        in: [
          TEST_SELECTION_PROCESS_CIDO_ID,
          TEST_SELECTION_PROCESS_2_CIDO_ID,
        ],
      },
    },
  });

  await prisma.user.deleteMany({
    where: {
      id: TEST_USER_ID,
    },
  });
}