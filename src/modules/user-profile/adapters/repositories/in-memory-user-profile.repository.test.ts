import { describe, expect, it } from "vitest";

import { UserProfile } from "../../domain/user-profile";
import { InMemoryUserProfileRepository } from "./in-memory-user-profile.repository";

describe("InMemoryUserProfileRepository", () => {
  const createProfile = () =>
    UserProfile.create({
      userId: "user-1",
      firstName: "Ana",
      lastName: "García",
    });

  it("guarda un perfil sin residencia", async () => {
    const repository = new InMemoryUserProfileRepository();

    await repository.save(createProfile());

    const found = await repository.findByUserId("user-1");

    expect(found?.residenceMunicipalityId).toBeNull();
  });

  it("guarda el municipio de residencia", async () => {
    const repository = new InMemoryUserProfileRepository();
    const profile = createProfile();

    profile.changeResidenceMunicipality(125);

    await repository.save(profile);

    const found = await repository.findByUserId("user-1");

    expect(found?.residenceMunicipalityId).toBe(125);
  });

  it("actualiza el municipio de residencia", async () => {
    const repository = new InMemoryUserProfileRepository();

    const saved = await repository.save(createProfile());

    const updated = UserProfile.restore({
      id: saved.id,
      userId: saved.userId,
      firstName: saved.firstName,
      lastName: saved.lastName,
      residenceMunicipalityId: 250,
    });

    await repository.save(updated);

    const found = await repository.findByUserId("user-1");

    expect(found?.residenceMunicipalityId).toBe(250);
  });

  it("permite eliminar la residencia", async () => {
    const repository = new InMemoryUserProfileRepository();
    const profile = createProfile();

    profile.changeResidenceMunicipality(125);

    const saved = await repository.save(profile);

    const updated = UserProfile.restore({
      id: saved.id,
      userId: saved.userId,
      firstName: saved.firstName,
      lastName: saved.lastName,
      residenceMunicipalityId: null,
    });

    await repository.save(updated);

    const found = await repository.findByUserId("user-1");

    expect(found?.residenceMunicipalityId).toBeNull();
  });

  it("rechaza actualizar un perfil inexistente", async () => {
    const repository = new InMemoryUserProfileRepository();

    const profile = UserProfile.restore({
      id: 999,
      userId: "user-1",
      firstName: "Ana",
      lastName: "García",
    });

    await expect(repository.save(profile)).rejects.toThrow(
      "El perfil que se intenta actualizar no existe",
    );

    expect(await repository.findByUserId("user-1")).toBeNull();
  });
});