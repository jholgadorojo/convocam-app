
import { describe, expect, it } from "vitest";

import {
  UserAcademicQualification,
  type AcademicQualificationType,
} from "./user-academic-qualification";

describe("UserAcademicQualification", () => {
  it("crea una titulación válida", () => {
    const qualification =
      UserAcademicQualification.create({
        userProfileId: 1,
        qualificationType: "UNIVERSITY_DEGREE",
        name: "Ingeniería Informática",
      });

    expect(qualification.id).toBeUndefined();
    expect(qualification.userProfileId).toBe(1);
    expect(qualification.qualificationType).toBe(
      "UNIVERSITY_DEGREE",
    );
    expect(qualification.name).toBe(
      "Ingeniería Informática",
    );
  });

  it("elimina espacios sobrantes de la denominación", () => {
    const qualification =
      UserAcademicQualification.create({
        userProfileId: 1,
        qualificationType: "VOCATIONAL_HIGHER",
        name: "  Desarrollo de Aplicaciones Web  ",
      });

    expect(qualification.name).toBe(
      "Desarrollo de Aplicaciones Web",
    );
  });

  it("rechaza un perfil inexistente", () => {
    expect(() =>
      UserAcademicQualification.create({
        userProfileId: 0,
        qualificationType: "ESO",
        name: "Educación Secundaria Obligatoria",
      }),
    ).toThrow(
      "El identificador del perfil no es válido",
    );
  });

  it("rechaza un tipo académico no permitido", () => {
    expect(() =>
      UserAcademicQualification.create({
        userProfileId: 1,
        qualificationType:
          "INVALID" as AcademicQualificationType,
        name: "Titulación de prueba",
      }),
    ).toThrow(
      "El tipo de titulación académica no es válido",
    );
  });

  it("rechaza una denominación vacía", () => {
    expect(() =>
      UserAcademicQualification.create({
        userProfileId: 1,
        qualificationType: "BACCALAUREATE",
        name: "   ",
      }),
    ).toThrow(
      "La denominación de la titulación es obligatoria",
    );
  });

  it("recupera una titulación existente", () => {
    const qualification =
      UserAcademicQualification.restore({
        id: 10,
        userProfileId: 1,
        qualificationType: "UNIVERSITY_MASTER",
        name: "Máster en Informática",
      });

    expect(qualification.id).toBe(10);
    expect(qualification.name).toBe(
      "Máster en Informática",
    );
  });

  it("permite modificar una titulación", () => {
    const qualification =
      UserAcademicQualification.create({
        userProfileId: 1,
        qualificationType: "ESO",
        name: "Educación Secundaria",
      });

    qualification.changeDetails(
      "BACCALAUREATE",
      "Bachillerato de Ciencias",
    );

    expect(qualification.qualificationType).toBe(
      "BACCALAUREATE",
    );
    expect(qualification.name).toBe(
      "Bachillerato de Ciencias",
    );
  });

  it("conserva los valores si una modificación es inválida", () => {
    const qualification =
      UserAcademicQualification.create({
        userProfileId: 1,
        qualificationType: "ESO",
        name: "Educación Secundaria",
      });

    expect(() =>
      qualification.changeDetails(
        "UNIVERSITY_DEGREE",
        "",
      ),
    ).toThrow();

    expect(qualification.qualificationType).toBe(
      "ESO",
    );
    expect(qualification.name).toBe(
      "Educación Secundaria",
    );
  });
});
