import { beforeEach, describe, expect, it } from "vitest";

import { InMemoryUserProfileRepository } from "../../adapters/repositories/in-memory-user-profile.repository";
import { UserProfile } from "../../domain/user-profile";
import { GetUserProfile } from "./get-user-profile";

describe("GetUserProfile", () => {
  let repository: InMemoryUserProfileRepository;
  let getUserProfile: GetUserProfile;

  beforeEach(() => {
    repository = new InMemoryUserProfileRepository();
    getUserProfile = new GetUserProfile(repository);
  });

  it("devuelve el perfil de un usuario existente", async () => {
    const profile = UserProfile.create({
      userId: "user-123",
      firstName: "Jose",
      lastName: "Holgado",
    });

    await repository.save(profile);

    const result = await getUserProfile.execute({
      userId: "user-123",
    });

    expect(result).not.toBeNull();
    expect(result?.id).toBe(1);
    expect(result?.userId).toBe("user-123");
    expect(result?.firstName).toBe("Jose");
    expect(result?.lastName).toBe("Holgado");
  });

  it("devuelve null si el usuario no tiene perfil", async () => {
    const result = await getUserProfile.execute({
      userId: "user-999",
    });

    expect(result).toBeNull();
  });
});