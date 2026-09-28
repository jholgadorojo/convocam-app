import "dotenv/config";

import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PrismaUserProfileRepository } from "@/modules/user-profile/adapters/repositories/prisma-user-profile.repository";
import { UserProfile } from "@/modules/user-profile/domain/user-profile";
import { prisma } from "@/shared/infrastructure/database/prisma";

describe("PrismaUserProfileRepository", () => {
  let repository: PrismaUserProfileRepository;
  let userId: string;

  beforeEach(async () => {
    repository = new PrismaUserProfileRepository(prisma);

    userId = `test-user-${randomUUID()}`;

    await prisma.user.create({
      data: {
        id: userId,
        name: "Usuario Test",
        email: `${userId}@test.local`,
        emailVerified: true,
      },
    });
  });

  afterEach(async () => {
    await prisma.userProfile.deleteMany({
      where: {
        userId,
      },
    });

    await prisma.user.deleteMany({
      where: {
        id: userId,
      },
    });
  });

  it("guarda un perfil en PostgreSQL", async () => {
    const profile = UserProfile.create({
      userId,
      firstName: "Jose",
      lastName: "Holgado",
    });

    const savedProfile = await repository.save(profile);

    expect(savedProfile.id).toBeDefined();
    expect(savedProfile.userId).toBe(userId);
    expect(savedProfile.firstName).toBe("Jose");
    expect(savedProfile.lastName).toBe("Holgado");
  });

  it("recupera un perfil por el identificador del usuario", async () => {
    const profile = UserProfile.create({
      userId,
      firstName: "Jose",
      lastName: "Holgado",
    });

    await repository.save(profile);

    const foundProfile = await repository.findByUserId(userId);

    expect(foundProfile).not.toBeNull();
    expect(foundProfile?.userId).toBe(userId);
    expect(foundProfile?.firstName).toBe("Jose");
    expect(foundProfile?.lastName).toBe("Holgado");
  });
});