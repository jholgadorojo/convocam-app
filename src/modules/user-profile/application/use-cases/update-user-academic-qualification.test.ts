
import { describe, expect, it } from "vitest";

import { UserProfile } from "../../domain/user-profile";

import {
  UserAcademicQualification,
  type AcademicQualificationType,
} from "../../domain/user-academic-qualification";

import { InMemoryUserProfileRepository } from "../../adapters/repositories/in-memory-user-profile.repository";

import { InMemoryUserAcademicQualificationRepository } from "../../adapters/repositories/in-memory-user-academic-qualification.repository";

import { UpdateUserAcademicQualification } from "./update-user-academic-qualification";

describe("UpdateUserAcademicQualification", () => {
  // ==========================================================
  // PREPARAR LOS REPOSITORIOS
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

    const useCase = new UpdateUserAcademicQualification(
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
  ) {
    return repository.save(
      UserAcademicQualification.create({
        userProfileId,
        qualificationType: "ESO",
        name: "Educación Secundaria Obligatoria",
      }),
    );
  }

  // ==========================================================
  // TEST 1 — MODIFICAR CORRECTAMENTE
  // ==========================================================

  it("modifica una titulación correctamente", async () => {
    const {
      profileA,
      qualificationRepository,
      useCase,
    } = await setup();

    const saved = await createQualification(
      qualificationRepository,
      profileA.id!,
    );

    const result = await useCase.execute({
      userId: "user-1",
      qualificationId: saved.id!,
      qualificationType: "BACCALAUREATE",
      name: "Bachillerato de Ciencias",
    });

    expect(result).toEqual({
      id: saved.id,
      qualificationType: "BACCALAUREATE",
      name: "Bachillerato de Ciencias",
    });
  });

  // ==========================================================
  // TEST 2 — NORMALIZAR DENOMINACIÓN
  // ==========================================================

  it("elimina espacios sobrantes de la denominación", async () => {
    const {
      profileA,
      qualificationRepository,
      useCase,
    } = await setup();

    const saved = await createQualification(
      qualificationRepository,
      profileA.id!,
    );

    const result = await useCase.execute({
      userId: "user-1",
      qualificationId: saved.id!,
      qualificationType: "UNIVERSITY_DEGREE",
      name: "  Ingeniería Informática  ",
    });

    expect(result.name).toBe("Ingeniería Informática");
  });

  // ==========================================================
  // TEST 3 — USUARIO SIN PERFIL
  // ==========================================================

  it("rechaza un usuario sin perfil", async () => {
    const { useCase } = await setup();

    await expect(
      useCase.execute({
        userId: "usuario-inexistente",
        qualificationId: 1,
        qualificationType: "ESO",
        name: "Educación Secundaria",
      }),
    ).rejects.toThrow(
      "El usuario no tiene un perfil",
    );
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
        qualificationType: "ESO",
        name: "Educación Secundaria",
      }),
    ).rejects.toThrow(
      "La titulación académica no existe",
    );
  });

  // ==========================================================
  // TEST 5 — TITULACIÓN DE OTRO USUARIO
  // ==========================================================

  it("impide modificar una titulación de otro usuario", async () => {
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
        qualificationType: "DOCTORATE",
        name: "Modificación no autorizada",
      }),
    ).rejects.toThrow(
      "La titulación académica no existe",
    );

    const original =
      await qualificationRepository
        .findByIdAndUserProfileId(
          saved.id!,
          profileB.id!,
        );

    expect(original?.qualificationType).toBe("ESO");
  });

  // ==========================================================
  // TEST 6 — DENOMINACIÓN VACÍA
  // ==========================================================

  it("rechaza una denominación vacía sin guardar cambios", async () => {
    const {
      profileA,
      qualificationRepository,
      useCase,
    } = await setup();

    const saved = await createQualification(
      qualificationRepository,
      profileA.id!,
    );

    await expect(
      useCase.execute({
        userId: "user-1",
        qualificationId: saved.id!,
        qualificationType: "BACCALAUREATE",
        name: "   ",
      }),
    ).rejects.toThrow(
      "La denominación de la titulación es obligatoria",
    );

    const original =
      await qualificationRepository
        .findByIdAndUserProfileId(
          saved.id!,
          profileA.id!,
        );

    expect(original?.qualificationType).toBe("ESO");
    expect(original?.name).toBe(
      "Educación Secundaria Obligatoria",
    );
  });

  // ==========================================================
  // TEST 7 — TIPO ACADÉMICO INVÁLIDO
  // ==========================================================

  it("rechaza un tipo académico no permitido", async () => {
    const {
      profileA,
      qualificationRepository,
      useCase,
    } = await setup();

    const saved = await createQualification(
      qualificationRepository,
      profileA.id!,
    );

    await expect(
      useCase.execute({
        userId: "user-1",
        qualificationId: saved.id!,
        qualificationType:
          "INVALID" as AcademicQualificationType,
        name: "Titulación de prueba",
      }),
    ).rejects.toThrow(
      "El tipo de titulación académica no es válido",
    );
  });

  // ==========================================================
  // TEST 8 — IDENTIFICADOR INVÁLIDO
  // ==========================================================

  it("rechaza un identificador de titulación inválido", async () => {
    const { useCase } = await setup();

    await expect(
      useCase.execute({
        userId: "user-1",
        qualificationId: -1,
        qualificationType: "ESO",
        name: "Educación Secundaria",
      }),
    ).rejects.toThrow(
      "El identificador de la titulación no es válido",
    );
  });
});
