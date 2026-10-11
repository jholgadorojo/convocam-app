import { describe, expect, it, vi } from "vitest";

import { UserProfile } from "../../domain/user-profile";
import { InMemoryUserProfileRepository } from "../../adapters/repositories/in-memory-user-profile.repository";
import { MunicipalityQueryRepository } from "../repositories/municipality-query.repository";
import { ChangeUserProfileResidence } from "./change-user-profile-residence";

describe("ChangeUserProfileResidence", () => {
  function setup() {
    const profileRepository = new InMemoryUserProfileRepository();

    const existsById = vi.fn(
      async (municipalityId: number) =>
        municipalityId === 125 || municipalityId === 250,
    );

    const municipalityRepository: MunicipalityQueryRepository = {
      existsById,
    };

    const useCase = new ChangeUserProfileResidence(
      profileRepository,
      municipalityRepository,
    );

    return {
      profileRepository,
      existsById,
      useCase,
    };
  }

  const createProfile = () =>
    UserProfile.create({
      userId: "user-1",
      firstName: "Ana",
      lastName: "García",
    });

  it("permite establecer un municipio existente", async () => {
    const { profileRepository, existsById, useCase } = setup();

    await profileRepository.save(createProfile());

    await useCase.execute({
      userId: "user-1",
      residenceMunicipalityId: 125,
    });

    const profile = await profileRepository.findByUserId("user-1");

    expect(profile?.residenceMunicipalityId).toBe(125);
    expect(existsById).toHaveBeenCalledWith(125);
  });

  it("permite cambiar el municipio de residencia", async () => {
    const { profileRepository, useCase } = setup();

    await profileRepository.save(createProfile());

    await useCase.execute({
      userId: "user-1",
      residenceMunicipalityId: 125,
    });

    await useCase.execute({
      userId: "user-1",
      residenceMunicipalityId: 250,
    });

    const profile = await profileRepository.findByUserId("user-1");

    expect(profile?.residenceMunicipalityId).toBe(250);
  });

  it("permite eliminar la residencia", async () => {
    const { profileRepository, existsById, useCase } = setup();

    await profileRepository.save(createProfile());

    await useCase.execute({
      userId: "user-1",
      residenceMunicipalityId: 125,
    });

    existsById.mockClear();

    await useCase.execute({
      userId: "user-1",
      residenceMunicipalityId: null,
    });

    const profile = await profileRepository.findByUserId("user-1");

    expect(profile?.residenceMunicipalityId).toBeNull();
    expect(existsById).not.toHaveBeenCalled();
  });

  it("rechaza un municipio inexistente", async () => {
    const { profileRepository, useCase } = setup();

    await profileRepository.save(createProfile());

    await expect(
      useCase.execute({
        userId: "user-1",
        residenceMunicipalityId: 999,
      }),
    ).rejects.toThrow("El municipio de residencia no existe");

    const profile = await profileRepository.findByUserId("user-1");

    expect(profile?.residenceMunicipalityId).toBeNull();
  });

  it("rechaza identificadores de municipio no válidos", async () => {
    const { profileRepository, existsById, useCase } = setup();

    await profileRepository.save(createProfile());

    for (const municipalityId of [0, -1, 1.5]) {
      await expect(
        useCase.execute({
          userId: "user-1",
          residenceMunicipalityId: municipalityId,
        }),
      ).rejects.toThrow("El municipio de residencia no es válido");
    }

    expect(existsById).not.toHaveBeenCalled();
  });

  it("rechaza modificar la residencia si el usuario no tiene perfil", async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute({
        userId: "user-1",
        residenceMunicipalityId: 125,
      }),
    ).rejects.toThrow("El usuario no tiene un perfil");
  });
});