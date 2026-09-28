import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryUserProfileRepository } from "../../adapters/repositories/in-memory-user-profile.repository";
import { CreateUserProfile } from "./create-user-profile";

describe("CreateUserProfile", () => {
  let repository: InMemoryUserProfileRepository;
  let createUserProfile: CreateUserProfile;

  beforeEach(() => {
    repository = new InMemoryUserProfileRepository();
    createUserProfile = new CreateUserProfile(repository);
  });

  it("crea correctamente un perfil de usuario", async () => {
    const result = await createUserProfile.execute({
      userId: "user-123",
      firstName: "Jose",
      lastName: "Holgado",
    });

    expect(result.id).toBe(1);
    expect(result.userId).toBe("user-123");
    expect(result.firstName).toBe("Jose");
    expect(result.lastName).toBe("Holgado");
  });

  it("guarda el perfil en el repositorio", async () => {
    await createUserProfile.execute({
      userId: "user-123",
      firstName: "Jose",
      lastName: "Holgado",
    });

    const savedProfile = await repository.findByUserId("user-123");

    expect(savedProfile).not.toBeNull();
    expect(savedProfile?.firstName).toBe("Jose");
    expect(savedProfile?.lastName).toBe("Holgado");
  });

  it("no permite crear dos perfiles para el mismo usuario", async () => {
    await createUserProfile.execute({
      userId: "user-123",
      firstName: "Jose",
      lastName: "Holgado",
    });

    await expect(
      createUserProfile.execute({
        userId: "user-123",
        firstName: "Jose",
        lastName: "Holgado",
      }),
    ).rejects.toThrow("El usuario ya tiene un perfil");
  });
});