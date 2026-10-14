
import { describe, expect, it } from "vitest";

import { UserProfile } from "../../domain/user-profile";

import { UserAcademicQualification } from "../../domain/user-academic-qualification";

import { InMemoryUserProfileRepository } from "../../adapters/repositories/in-memory-user-profile.repository";

import { InMemoryUserAcademicQualificationRepository } from "../../adapters/repositories/in-memory-user-academic-qualification.repository";

import { ListUserAcademicQualifications } from "./list-user-academic-qualifications";

describe("ListUserAcademicQualifications", () => {
  // ==========================================================
  // PREPARAR REPOSITORIOS
  // ==========================================================

  function setup() {
    const userProfileRepository =
      new InMemoryUserProfileRepository();

    const qualificationRepository =
      new InMemoryUserAcademicQualificationRepository();

    const useCase = new ListUserAcademicQualifications(
      userProfileRepository,
      qualificationRepository,
    );

    return {
      userProfileRepository,
      qualificationRepository,
      useCase,
    };
  }

  async function createProfile(
    repository: InMemoryUserProfileRepository,
    userId: string,
  ) {
    return repository.save(
      UserProfile.create({
        userId,
        firstName: "Usuario",
        lastName: "Prueba",
      }),
    );
  }

  // ==========================================================
  // TEST 1 — LISTAR TITULACIONES
  // ==========================================================

  it("devuelve las titulaciones del usuario", async () => {
    const {
      userProfileRepository,
      qualificationRepository,
      useCase,
    } = setup();

    const profile = await createProfile(
      userProfileRepository,
      "user-1",
    );

    await qualificationRepository.save(
      UserAcademicQualification.create({
        userProfileId: profile.id!,
        qualificationType: "ESO",
        name: "Educación Secundaria Obligatoria",
      }),
    );

    await qualificationRepository.save(
      UserAcademicQualification.create({
        userProfileId: profile.id!,
        qualificationType: "UNIVERSITY_DEGREE",
        name: "Ingeniería Informática",
      }),
    );

    const result = await useCase.execute({
      userId: "user-1",
    });

    expect(result).toHaveLength(2);

    expect(result[0]).toEqual({
      id: 1,
      qualificationType: "ESO",
      name: "Educación Secundaria Obligatoria",
    });

    expect(result[1]).toEqual({
      id: 2,
      qualificationType: "UNIVERSITY_DEGREE",
      name: "Ingeniería Informática",
    });
  });

  // ==========================================================
  // TEST 2 — PERFIL SIN TITULACIONES
  // ==========================================================

  it("devuelve una lista vacía si no hay titulaciones", async () => {
    const {
      userProfileRepository,
      useCase,
    } = setup();

    await createProfile(
      userProfileRepository,
      "user-1",
    );

    const result = await useCase.execute({
      userId: "user-1",
    });

    expect(result).toEqual([]);
  });

  // ==========================================================
  // TEST 3 — USUARIO SIN PERFIL
  // ==========================================================

  it("devuelve una lista vacía si el perfil no existe", async () => {
    const { useCase } = setup();

    const result = await useCase.execute({
      userId: "usuario-inexistente",
    });

    expect(result).toEqual([]);
  });

  // ==========================================================
  // TEST 4 — AISLAMIENTO ENTRE USUARIOS
  // ==========================================================

  it("no devuelve titulaciones de otro usuario", async () => {
    const {
      userProfileRepository,
      qualificationRepository,
      useCase,
    } = setup();

    const profileA = await createProfile(
      userProfileRepository,
      "user-1",
    );

    const profileB = await createProfile(
      userProfileRepository,
      "user-2",
    );

    await qualificationRepository.save(
      UserAcademicQualification.create({
        userProfileId: profileA.id!,
        qualificationType: "ESO",
        name: "Titulación del usuario A",
      }),
    );

    await qualificationRepository.save(
      UserAcademicQualification.create({
        userProfileId: profileB.id!,
        qualificationType: "BACCALAUREATE",
        name: "Titulación del usuario B",
      }),
    );

    const result = await useCase.execute({
      userId: "user-1",
    });

    expect(result).toHaveLength(1);

    expect(result[0].name).toBe(
      "Titulación del usuario A",
    );
  });
});
