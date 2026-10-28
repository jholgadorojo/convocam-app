
import { describe, expect, it } from "vitest";

import { UserProfile } from "../../domain/user-profile";

import { UserAcademicQualification } from "../../domain/user-academic-qualification";

import {
  AcademicQualificationNotFoundError,
  UserProfileNotFoundError,
} from "../../domain/user-profile-errors";

import { InMemoryUserProfileRepository } from "../../adapters/repositories/in-memory-user-profile.repository";

import { InMemoryUserAcademicQualificationRepository } from "../../adapters/repositories/in-memory-user-academic-qualification.repository";

import { DeleteUserAcademicQualification } from "./delete-user-academic-qualification";

describe("DeleteUserAcademicQualification", () => {
  // ==========================================================
  // PREPARAR REPOSITORIOS Y USUARIOS
  // ==========================================================

  async function setup() {
    const userProfileRepository =
      new InMemoryUserProfileRepository();

    const qualificationRepository =
      new InMemoryUserAcademicQualificationRepository();

    const profileA = await userProfileRepository.save(
      UserProfile.create({
        userId: "user-1",
        firstName: "Ana",
        lastName: "García",
      }),
    );

    const profileB = await userProfileRepository.save(
      UserProfile.create({
        userId: "user-2",
        firstName: "Pedro",
        lastName: "López",
      }),
    );

    const useCase = new DeleteUserAcademicQualification(
      userProfileRepository,
      qualificationRepository,
    );

    return {
      profileA,
      profileB,
      qualificationRepository,
      useCase,
    };
  }

  // ==========================================================
  // CREAR TITULACIÓN DE PRUEBA
  // ==========================================================

  async function createQualification(
    repository: InMemoryUserAcademicQualificationRepository,
    userProfileId: number,
    name = "Educación Secundaria Obligatoria",
  ) {
    return repository.save(
      UserAcademicQualification.create({
        userProfileId,
        qualificationType: "ESO",
        name,
      }),
    );
  }

  // ==========================================================
  // TEST 1 — ELIMINAR CORRECTAMENTE
  // ==========================================================

  it("elimina una titulación del usuario", async () => {
    const {
      profileA,
      qualificationRepository,
      useCase,
    } = await setup();

    const saved = await createQualification(
      qualificationRepository,
      profileA.id!,
    );

    await useCase.execute({
      userId: "user-1",
      qualificationId: saved.id!,
    });

    const result =
      await qualificationRepository.listByUserProfileId(
        profileA.id!,
      );

    expect(result).toHaveLength(0);
  });

  // ==========================================================
  // TEST 2 — IMPEDIR ELIMINAR DE OTRO USUARIO
  // ==========================================================

  it("impide eliminar una titulación de otro usuario", async () => {
    const {
      profileB,
      qualificationRepository,
      useCase,
    } = await setup();

    const saved = await createQualification(
      qualificationRepository,
      profileB.id!,
    );

    await expect(
      useCase.execute({
        userId: "user-1",
        qualificationId: saved.id!,
      }),
    ).rejects.toThrow(
      AcademicQualificationNotFoundError,
    );

    const original =
      await qualificationRepository
        .findByIdAndUserProfileId(
          saved.id!,
          profileB.id!,
        );

    expect(original).not.toBeNull();
  });

  // ==========================================================
  // TEST 3 — CONSERVAR OTRAS TITULACIONES
  // ==========================================================

  it("no elimina otras titulaciones del usuario", async () => {
    const {
      profileA,
      qualificationRepository,
      useCase,
    } = await setup();

    const first = await createQualification(
      qualificationRepository,
      profileA.id!,
      "ESO",
    );

    await createQualification(
      qualificationRepository,
      profileA.id!,
      "Bachillerato",
    );

    await useCase.execute({
      userId: "user-1",
      qualificationId: first.id!,
    });

    const result =
      await qualificationRepository.listByUserProfileId(
        profileA.id!,
      );

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Bachillerato");
  });

  // ==========================================================
  // TEST 4 — TITULACIÓN INEXISTENTE
  // ==========================================================

  it("rechaza una titulación inexistente", async () => {
    const { useCase } = await setup();

    await expect(
      useCase.execute({
        userId: "user-1",
        qualificationId: 99999,
      }),
    ).rejects.toThrow(
      AcademicQualificationNotFoundError,
    );
  });

  // ==========================================================
  // TEST 5 — USUARIO SIN PERFIL
  // ==========================================================

  it("rechaza un usuario sin perfil", async () => {
    const { useCase } = await setup();

    await expect(
      useCase.execute({
        userId: "usuario-inexistente",
        qualificationId: 1,
      }),
    ).rejects.toThrow(
      UserProfileNotFoundError,
    );
  });

  // ==========================================================
  // TEST 6 — IDENTIFICADOR CERO
  // ==========================================================

  it("rechaza un identificador igual a cero", async () => {
    const { useCase } = await setup();

    await expect(
      useCase.execute({
        userId: "user-1",
        qualificationId: 0,
      }),
    ).rejects.toThrow(
      "El identificador de la titulación no es válido",
    );
  });

  // ==========================================================
  // TEST 7 — IDENTIFICADOR NO ENTERO
  // ==========================================================

  it("rechaza un identificador decimal", async () => {
    const { useCase } = await setup();

    await expect(
      useCase.execute({
        userId: "user-1",
        qualificationId: 1.5,
      }),
    ).rejects.toThrow(
      "El identificador de la titulación no es válido",
    );
  });

  // ==========================================================
  // TEST 8 — NO ELIMINAR DOS VECES
  // ==========================================================

  it("no permite eliminar dos veces la misma titulación", async () => {
    const {
      profileA,
      qualificationRepository,
      useCase,
    } = await setup();

    const saved = await createQualification(
      qualificationRepository,
      profileA.id!,
    );

    await useCase.execute({
      userId: "user-1",
      qualificationId: saved.id!,
    });

    await expect(
      useCase.execute({
        userId: "user-1",
        qualificationId: saved.id!,
      }),
    ).rejects.toThrow(
      AcademicQualificationNotFoundError,
    );
  });
});
