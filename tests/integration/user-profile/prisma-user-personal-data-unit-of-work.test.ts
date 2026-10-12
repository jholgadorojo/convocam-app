
import "dotenv/config";

import { randomUUID } from "node:crypto";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import { prisma } from "@/shared/infrastructure/database/prisma";

import { UserProfile } from "@/modules/user-profile/domain/user-profile";

import { PrismaUserPersonalDataUnitOfWork } from "@/modules/user-profile/adapters/repositories/prisma-user-personal-data-unit-of-work";

describe("PrismaUserPersonalDataUnitOfWork", () => {
  const unitOfWork = new PrismaUserPersonalDataUnitOfWork(
    prisma,
  );

  let userId: string;
  let provinceId: number | undefined;
  let countyId: number | undefined;
  let municipalityId: number | undefined;

  beforeAll(async () => {
    const database = await prisma.$queryRaw<
      Array<{ name: string }>
    >`
      SELECT current_database() AS name
    `;

    if (database[0]?.name !== "convocam_test") {
      throw new Error(
        "Los tests deben utilizar convocam_test",
      );
    }
  });

  beforeEach(async () => {
    userId = `test-user-${randomUUID()}`;

    provinceId = undefined;
    countyId = undefined;
    municipalityId = undefined;

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
      where: { userId },
    });

    if (municipalityId !== undefined) {
      await prisma.municipality.delete({
        where: { id: municipalityId },
      });
    }

    if (countyId !== undefined) {
      await prisma.county.delete({
        where: { id: countyId },
      });
    }

    if (provinceId !== undefined) {
      await prisma.province.delete({
        where: { id: provinceId },
      });
    }

    await prisma.user.deleteMany({
      where: { id: userId },
    });
  });

  it("crea el perfil y sincroniza el nombre del usuario", async () => {
    const profile = UserProfile.create({
      userId,
      firstName: "Ana",
      lastName: "García",
    });

    const saved = await unitOfWork.saveProfileAndUserName(
      profile,
    );

    const databaseProfile =
      await prisma.userProfile.findUnique({
        where: { userId },
      });

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    expect(saved.id).toBeDefined();

    expect(databaseProfile?.firstName).toBe("Ana");
    expect(databaseProfile?.lastName).toBe("García");

    expect(user?.name).toBe("Ana García");
  });

  it("actualiza el perfil y el nombre del usuario", async () => {
    const existing = await prisma.userProfile.create({
      data: {
        userId,
        firstName: "Ana",
        lastName: "García",
      },
    });

    const profile = UserProfile.restore({
      id: existing.id,
      userId,
      firstName: existing.firstName,
      lastName: existing.lastName,
    });

    profile.changePersonalData(
      "María",
      "López",
    );

    const saved = await unitOfWork.saveProfileAndUserName(
      profile,
    );

    const databaseProfile =
      await prisma.userProfile.findUnique({
        where: { userId },
      });

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    expect(saved.id).toBe(existing.id);
    expect(databaseProfile?.firstName).toBe("María");
    expect(databaseProfile?.lastName).toBe("López");
    expect(user?.name).toBe("María López");
  });

  it("conserva la residencia al modificar los datos personales", async () => {
    const uniqueCode = randomUUID();

    const province = await prisma.province.create({
      data: {
        code: `test-province-${uniqueCode}`,
        name: "Provincia Test",
      },
    });

    provinceId = province.id;

    const county = await prisma.county.create({
      data: {
        code: `test-county-${uniqueCode}`,
        name: "Comarca Test",
      },
    });

    countyId = county.id;

    const municipality = await prisma.municipality.create({
      data: {
        code: `test-municipality-${uniqueCode}`,
        name: "Municipio Test",
        provinceId,
        countyId,
      },
    });

    municipalityId = municipality.id;

    const existing = await prisma.userProfile.create({
      data: {
        userId,
        firstName: "Ana",
        lastName: "García",
        residenceMunicipalityId: municipalityId,
      },
    });

    const profile = UserProfile.restore({
      id: existing.id,
      userId,
      firstName: existing.firstName,
      lastName: existing.lastName,
      residenceMunicipalityId:
        existing.residenceMunicipalityId,
    });

    profile.changePersonalData("María", "López");

    await unitOfWork.saveProfileAndUserName(profile);

    const saved = await prisma.userProfile.findUnique({
      where: { userId },
    });

    expect(saved?.firstName).toBe("María");
    expect(saved?.lastName).toBe("López");

    expect(saved?.residenceMunicipalityId).toBe(
      municipalityId,
    );
  });

  it("no modifica el usuario cuando falla la actualización del perfil", async () => {
    const profile = UserProfile.restore({
      id: 999999999,
      userId,
      firstName: "María",
      lastName: "López",
    });

    await expect(
      unitOfWork.saveProfileAndUserName(profile),
    ).rejects.toThrow();

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    const databaseProfile =
      await prisma.userProfile.findUnique({
        where: { userId },
      });

    expect(user?.name).toBe("Usuario Test");
    expect(databaseProfile).toBeNull();
  });
});
