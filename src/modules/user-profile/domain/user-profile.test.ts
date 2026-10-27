import { describe, expect, it } from "vitest";

import { UserProfile } from "./user-profile";

describe("UserProfile", () => {
  it("does not allow an empty user id", () => {
    expect(() =>
      UserProfile.create({
        userId: "",
        firstName: "Jose",
        lastName: "Holgado",
      }),
    ).toThrow("El identificador del usuario es obligatorio");
  });

  it("does not allow an empty first name", () => {
    expect(() =>
      UserProfile.create({
        userId: "user-123",
        firstName: "",
        lastName: "Holgado",
      }),
    ).toThrow("El nombre es obligatorio");
  });

  it("does not allow an empty last name", () => {
    expect(() =>
      UserProfile.create({
        userId: "user-123",
        firstName: "Jose",
        lastName: "",
      }),
    ).toThrow("Los apellidos son obligatorios");
  });

  it("does not restore a profile with an invalid id", () => {
    expect(() =>
      UserProfile.restore({
        id: 0,
        userId: "user-123",
        firstName: "Jose",
        lastName: "Holgado",
      }),
    ).toThrow("El identificador del perfil no es válido");
  });

  it("rechaza un nombre de más de 100 caracteres", () => {
    expect(() =>
      UserProfile.create({
        userId: "user-123",
        firstName: "A".repeat(101),
        lastName: "Holgado",
      }),
    ).toThrow("El nombre no puede superar los 100 caracteres");
  });

  it("rechaza unos apellidos de más de 150 caracteres", () => {
    const profile = UserProfile.create({
      userId: "user-123",
      firstName: "Jose",
      lastName: "Holgado",
    });

    expect(() =>
      profile.changePersonalData("Jose", "B".repeat(151)),
    ).toThrow("Los apellidos no pueden superar los 150 caracteres");
    expect(profile.lastName).toBe("Holgado");
  });

  it("acepta nombre y apellidos en el límite permitido", () => {
    const profile = UserProfile.create({
      userId: "user-123",
      firstName: "A".repeat(100),
      lastName: "B".repeat(150),
    });

    expect(profile.firstName).toHaveLength(100);
    expect(profile.lastName).toHaveLength(150);
  });

  it("rechaza un nombre de registro de más de 100 caracteres", () => {
    expect(() =>
      UserProfile.createForRegistration({
        userId: "user-123",
        name: "A".repeat(101),
      }),
    ).toThrow("El nombre no puede superar los 100 caracteres");
  });
});
describe("UserProfile - residencia", () => {
  const createProfile = () =>
    UserProfile.create({
      userId: "user-1",
      firstName: "Ana",
      lastName: "García",
    });

  it("crea un perfil sin municipio de residencia", () => {
    const profile = createProfile();

    expect(profile.residenceMunicipalityId).toBeNull();
  });

  it("permite establecer un municipio de residencia", () => {
    const profile = createProfile();

    profile.changeResidenceMunicipality(125);

    expect(profile.residenceMunicipalityId).toBe(125);
  });

  it("permite cambiar el municipio de residencia", () => {
    const profile = createProfile();

    profile.changeResidenceMunicipality(125);
    profile.changeResidenceMunicipality(250);

    expect(profile.residenceMunicipalityId).toBe(250);
  });

  it("permite eliminar el municipio de residencia", () => {
    const profile = createProfile();

    profile.changeResidenceMunicipality(125);
    profile.changeResidenceMunicipality(null);

    expect(profile.residenceMunicipalityId).toBeNull();
  });

  it("rechaza identificadores de municipio no válidos", () => {
    const profile = createProfile();

    expect(() => profile.changeResidenceMunicipality(0)).toThrow(
      "El municipio de residencia no es válido",
    );

    expect(() => profile.changeResidenceMunicipality(-1)).toThrow(
      "El municipio de residencia no es válido",
    );

    expect(() => profile.changeResidenceMunicipality(1.5)).toThrow(
      "El municipio de residencia no es válido",
    );
  });

  it("restaura un perfil con su municipio de residencia", () => {
    const profile = UserProfile.restore({
      id: 1,
      userId: "user-1",
      firstName: "Ana",
      lastName: "García",
      residenceMunicipalityId: 125,
    });

    expect(profile.residenceMunicipalityId).toBe(125);
  });

  describe("UserProfile - datos personales", () => {
    const createProfile = () =>
      UserProfile.create({
        userId: "user-1",
        firstName: "Ana",
        lastName: "García",
      });

    it("permite modificar el nombre y los apellidos", () => {
      const profile = createProfile();

      profile.changePersonalData(
        "María",
        "López",
      );

      expect(profile.firstName).toBe("María");
      expect(profile.lastName).toBe("López");
    });

    it("elimina los espacios al principio y al final", () => {
      const profile = createProfile();

      profile.changePersonalData(
        "  Ana María  ",
        "  García López  ",
      );

      expect(profile.firstName).toBe("Ana María");
      expect(profile.lastName).toBe("García López");
    });

    it("rechaza un nombre vacío", () => {
      const profile = createProfile();

      expect(() =>
        profile.changePersonalData("", "López"),
      ).toThrow("El nombre es obligatorio");

      expect(() =>
        profile.changePersonalData("   ", "López"),
      ).toThrow("El nombre es obligatorio");
    });

    it("rechaza unos apellidos vacíos", () => {
      const profile = createProfile();

      expect(() =>
        profile.changePersonalData("María", ""),
      ).toThrow("Los apellidos son obligatorios");

      expect(() =>
        profile.changePersonalData("María", "   "),
      ).toThrow("Los apellidos son obligatorios");
    });

    it("conserva los datos anteriores si la modificación falla", () => {
      const profile = createProfile();

      expect(() =>
        profile.changePersonalData("María", ""),
      ).toThrow("Los apellidos son obligatorios");

      expect(profile.firstName).toBe("Ana");
      expect(profile.lastName).toBe("García");
    });
  });
});