
import { beforeEach, describe, expect, it } from "vitest";

import { UserAcademicQualification } from "../../domain/user-academic-qualification";

import { InMemoryUserAcademicQualificationRepository } from "./in-memory-user-academic-qualification.repository";

describe(
  "InMemoryUserAcademicQualificationRepository",
  () => {
    let repository: InMemoryUserAcademicQualificationRepository;

    beforeEach(() => {
      repository =
        new InMemoryUserAcademicQualificationRepository();
    });

    function createQualification(
      userProfileId: number,
      name: string,
    ) {
      return UserAcademicQualification.create({
        userProfileId,
        qualificationType: "ESO",
        name,
      });
    }

    it("guarda una titulación nueva", async () => {
      const qualification = createQualification(
        1,
        "Educación Secundaria Obligatoria",
      );

      const saved = await repository.save(qualification);

      expect(saved.id).toBe(1);
      expect(saved.userProfileId).toBe(1);
      expect(saved.name).toBe(
        "Educación Secundaria Obligatoria",
      );
    });

    it("asigna identificadores consecutivos", async () => {
      const first = await repository.save(
        createQualification(1, "ESO"),
      );

      const second = await repository.save(
        createQualification(1, "Otra titulación"),
      );

      expect(first.id).toBe(1);
      expect(second.id).toBe(2);
    });

    it("lista únicamente las titulaciones de un perfil", async () => {
      await repository.save(
        createQualification(1, "ESO"),
      );

      await repository.save(
        createQualification(1, "Bachillerato"),
      );

      await repository.save(
        createQualification(2, "Titulación de otro perfil"),
      );

      const result =
        await repository.listByUserProfileId(1);

      expect(result).toHaveLength(2);

      expect(result.map((item) => item.name)).toEqual([
        "ESO",
        "Bachillerato",
      ]);
    });

    it("impide consultar una titulación de otro perfil", async () => {
      const saved = await repository.save(
        createQualification(1, "ESO"),
      );

      const result =
        await repository.findByIdAndUserProfileId(
          saved.id!,
          2,
        );

      expect(result).toBeNull();
    });

    it("actualiza una titulación existente", async () => {
      const saved = await repository.save(
        createQualification(1, "ESO"),
      );

      saved.changeDetails(
        "BACCALAUREATE",
        "Bachillerato de Ciencias",
      );

      await repository.save(saved);

      const updated =
        await repository.findByIdAndUserProfileId(
          saved.id!,
          1,
        );

      expect(updated?.qualificationType).toBe(
        "BACCALAUREATE",
      );

      expect(updated?.name).toBe(
        "Bachillerato de Ciencias",
      );
    });

    it("impide cambiar la titulación a otro perfil", async () => {
      const saved = await repository.save(
        createQualification(1, "ESO"),
      );

      const invalid =
        UserAcademicQualification.restore({
          id: saved.id!,
          userProfileId: 2,
          qualificationType: "ESO",
          name: "Otra titulación",
        });

      await expect(
        repository.save(invalid),
      ).rejects.toThrow(
        "La titulación no pertenece al perfil indicado",
      );
    });

    it("elimina únicamente titulaciones del perfil indicado", async () => {
      const saved = await repository.save(
        createQualification(1, "ESO"),
      );

      const wrongProfile =
        await repository.deleteByIdAndUserProfileId(
          saved.id!,
          2,
        );

      expect(wrongProfile).toBe(false);

      const deleted =
        await repository.deleteByIdAndUserProfileId(
          saved.id!,
          1,
        );

      expect(deleted).toBe(true);

      const result =
        await repository.listByUserProfileId(1);

      expect(result).toHaveLength(0);
    });

    it("no guarda modificaciones sin ejecutar save", async () => {
      const saved = await repository.save(
        createQualification(1, "ESO"),
      );

      saved.changeDetails(
        "DOCTORATE",
        "Doctorado de prueba",
      );

      const result =
        await repository.findByIdAndUserProfileId(
          saved.id!,
          1,
        );

      expect(result?.qualificationType).toBe("ESO");
      expect(result?.name).toBe("ESO");
    });
  },
);
