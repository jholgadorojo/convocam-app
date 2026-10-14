
import { describe, expect, it } from "vitest";

import { UserProfile } from "../../domain/user-profile";

import type { AcademicQualificationType } from "../../domain/user-academic-qualification";

import { InMemoryUserProfileRepository } from "../../adapters/repositories/in-memory-user-profile.repository";

import { InMemoryUserAcademicQualificationRepository } from "../../adapters/repositories/in-memory-user-academic-qualification.repository";

import { AddUserAcademicQualification } from "./add-user-academic-qualification";

describe("AddUserAcademicQualification", () => {
  // ==========================================================
  // PREPARAR REPOSITORIOS Y PERFIL
  // ==========================================================

  async function setup() {
    const userProfileRepository =
      new InMemoryUserProfileRepository();

    const qualificationRepository =
      new InMemoryUserAcademicQualificationRepository();

    const profile = await userProfileRepository.save(
      UserProfile.create({
        userId: "user-1",
        firstName: "Ana",
        lastName: "García",
      }),
    );

    const useCase = new AddUserAcademicQualification(
      userProfileRepository,
      qualificationRepository,
    );

    return {
      profile,
      userProfileRepository,
      qualificationRepository,
      useCase,
    };
  }

  // ==========================================================
  // TEST 1 — AÑADIR
  // ==========================================================

  it("añade una titulación correctamente", async () => {
    const { profile, qualificationRepository, useCase } =
      await setup();

    const result = await useCase.execute({
      userId: "user-1",
      qualificationType: "UNIVERSITY_DEGREE",
      name: "Ingeniería Informática",
    });

    expect(result.id).toBeDefined();
    expect(result.qualificationType).toBe(
      "UNIVERSITY_DEGREE",
    );
    expect(result.name).toBe("Ingeniería Informática");

    const stored =
      await qualificationRepository.listByUserProfileId(
        profile.id!,
      );

    expect(stored).toHaveLength(1);
    expect(stored[0].name).toBe(
      "Ingeniería Informática",
    );
  });

  // ==========================================================
  // TEST 2 — NORMALIZAR NOMBRE
  // ==========================================================

  it("elimina los espacios sobrantes", async () => {
    const { useCase } = await setup();

    const result = await useCase.execute({
      userId: "user-1",
      qualificationType: "VOCATIONAL_HIGHER",
      name: "  Desarrollo de Aplicaciones Web  ",
    });

    expect(result.name).toBe(
      "Desarrollo de Aplicaciones Web",
    );
  });

  // ==========================================================
  // TEST 3 — VARIAS TITULACIONES
  // ==========================================================

  it("permite añadir varias titulaciones al mismo perfil", async () => {
    const { profile, qualificationRepository, useCase } =
      await setup();

    await useCase.execute({
      userId: "user-1",
      qualificationType: "ESO",
      name: "Educación Secundaria Obligatoria",
    });

    await useCase.execute({
      userId: "user-1",
      qualificationType: "BACCALAUREATE",
      name: "Bachillerato",
    });

    const qualifications =
      await qualificationRepository.listByUserProfileId(
        profile.id!,
      );

    expect(qualifications).toHaveLength(2);
  });

  // ==========================================================
  // TEST 4 — PERFIL INEXISTENTE
  // ==========================================================

  it("rechaza un usuario sin perfil", async () => {
    const { useCase } = await setup();

    await expect(
      useCase.execute({
        userId: "usuario-inexistente",
        qualificationType: "ESO",
        name: "Educación Secundaria",
      }),
    ).rejects.toThrow(
      "El usuario no tiene un perfil",
    );
  });

  // ==========================================================
  // TEST 5 — DENOMINACIÓN VACÍA
  // ==========================================================

  it("rechaza una denominación vacía", async () => {
    const { useCase } = await setup();

    await expect(
      useCase.execute({
        userId: "user-1",
        qualificationType: "ESO",
        name: "   ",
      }),
    ).rejects.toThrow(
      "La denominación de la titulación es obligatoria",
    );
  });

  // ==========================================================
  // TEST 6 — TIPO INVÁLIDO
  // ==========================================================

  it("rechaza un tipo académico no permitido", async () => {
    const { useCase } = await setup();

    await expect(
      useCase.execute({
        userId: "user-1",
        qualificationType:
          "INVALID" as AcademicQualificationType,
        name: "Titulación de prueba",
      }),
    ).rejects.toThrow(
      "El tipo de titulación académica no es válido",
    );
  });

  // ==========================================================
  // TEST 7 — AISLAMIENTO ENTRE PERFILES
  // ==========================================================

  it("guarda la titulación en el perfil del usuario indicado", async () => {
    const {
      profile,
      userProfileRepository,
      qualificationRepository,
      useCase,
    } = await setup();

    const secondProfile = await userProfileRepository.save(
      UserProfile.create({
        userId: "user-2",
        firstName: "Pedro",
        lastName: "López",
      }),
    );

    await useCase.execute({
      userId: "user-2",
      qualificationType: "ESO",
      name: "Educación Secundaria",
    });

    const firstQualifications =
      await qualificationRepository.listByUserProfileId(
        profile.id!,
      );

    const secondQualifications =
      await qualificationRepository.listByUserProfileId(
        secondProfile.id!,
      );

    expect(firstQualifications).toHaveLength(0);
    expect(secondQualifications).toHaveLength(1);
  });
});
