
import {
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import { UserTerritorialPreference } from "../../domain/user-territorial-preference";

import { InMemoryUserTerritorialPreferenceRepository } from "./in-memory-user-territorial-preference.repository";

describe(
  "InMemoryUserTerritorialPreferenceRepository",
  () => {
    let repository: InMemoryUserTerritorialPreferenceRepository;

    beforeEach(() => {
      repository =
        new InMemoryUserTerritorialPreferenceRepository();
    });

    // ========================================================
    // TEST 1 — SIN CONFIGURAR
    // ========================================================

    it("devuelve null si no existen preferencias", async () => {
      const result =
        await repository.findByUserProfileId(1);

      expect(result).toBeNull();
    });

    // ========================================================
    // TEST 2 — TODA CATALUNYA
    // ========================================================

    it("guarda preferencias para toda Catalunya", async () => {
      const preference =
        UserTerritorialPreference.createAllCatalonia(1);

      const saved = await repository.save(preference);

      expect(saved.id).toBe(1);
      expect(saved.userProfileId).toBe(1);
      expect(saved.scope).toBe("ALL_CATALONIA");
      expect(saved.provinceIds).toEqual([]);
      expect(saved.countyIds).toEqual([]);
      expect(saved.municipalityIds).toEqual([]);
    });

    // ========================================================
    // TEST 3 — TERRITORIOS COMBINADOS
    // ========================================================

    it("guarda provincias, comarcas y municipios", async () => {
      const preference =
        UserTerritorialPreference.createSelectedTerritories(
          1,
          {
            provinceIds: [1, 2],
            countyIds: [5],
            municipalityIds: [20, 30],
          },
        );

      await repository.save(preference);

      const result =
        await repository.findByUserProfileId(1);

      expect(result?.scope).toBe(
        "SELECTED_TERRITORIES",
      );
      expect(result?.provinceIds).toEqual([1, 2]);
      expect(result?.countyIds).toEqual([5]);
      expect(result?.municipalityIds).toEqual([20, 30]);
    });

    // ========================================================
    // TEST 4 — ACTUALIZAR CONFIGURACIÓN
    // ========================================================

    it("sustituye las preferencias conservando su identificador", async () => {
      const initial =
        UserTerritorialPreference.createSelectedTerritories(
          1,
          {
            provinceIds: [1],
            countyIds: [5],
            municipalityIds: [],
          },
        );

      const firstSaved =
        await repository.save(initial);

      const newPreference =
        UserTerritorialPreference.createSelectedTerritories(
          1,
          {
            provinceIds: [],
            countyIds: [],
            municipalityIds: [20, 30],
          },
        );

      const updated =
        await repository.save(newPreference);

      expect(updated.id).toBe(firstSaved.id);
      expect(updated.provinceIds).toEqual([]);
      expect(updated.countyIds).toEqual([]);
      expect(updated.municipalityIds).toEqual([20, 30]);
    });

    // ========================================================
    // TEST 5 — CAMBIAR A TODA CATALUNYA
    // ========================================================

    it("permite cambiar a toda Catalunya", async () => {
      const initial =
        UserTerritorialPreference.createSelectedTerritories(
          1,
          {
            provinceIds: [1],
            countyIds: [5],
            municipalityIds: [],
          },
        );

      const saved = await repository.save(initial);

      saved.selectAllCatalonia();

      await repository.save(saved);

      const result =
        await repository.findByUserProfileId(1);

      expect(result?.scope).toBe("ALL_CATALONIA");
      expect(result?.provinceIds).toEqual([]);
      expect(result?.countyIds).toEqual([]);
      expect(result?.municipalityIds).toEqual([]);
    });

    // ========================================================
    // TEST 6 — AISLAMIENTO ENTRE PERFILES
    // ========================================================

    it("mantiene independientes las preferencias de dos perfiles", async () => {
      await repository.save(
        UserTerritorialPreference.createSelectedTerritories(
          1,
          {
            provinceIds: [1],
            countyIds: [],
            municipalityIds: [],
          },
        ),
      );

      await repository.save(
        UserTerritorialPreference.createSelectedTerritories(
          2,
          {
            provinceIds: [],
            countyIds: [8],
            municipalityIds: [],
          },
        ),
      );

      const first =
        await repository.findByUserProfileId(1);

      const second =
        await repository.findByUserProfileId(2);

      expect(first?.provinceIds).toEqual([1]);
      expect(first?.countyIds).toEqual([]);

      expect(second?.provinceIds).toEqual([]);
      expect(second?.countyIds).toEqual([8]);

      expect(first?.id).not.toBe(second?.id);
    });

    // ========================================================
    // TEST 7 — MODIFICACIÓN SIN GUARDAR
    // ========================================================

    it("no modifica los datos almacenados sin ejecutar save", async () => {
      await repository.save(
        UserTerritorialPreference.createAllCatalonia(1),
      );

      const preference =
        await repository.findByUserProfileId(1);

      preference!.selectTerritories({
        provinceIds: [1],
        countyIds: [],
        municipalityIds: [],
      });

      const stored =
        await repository.findByUserProfileId(1);

      expect(stored?.scope).toBe("ALL_CATALONIA");
      expect(stored?.provinceIds).toEqual([]);
    });

    // ========================================================
    // TEST 8 — ELIMINAR PREFERENCIAS
    // ========================================================

    it("elimina las preferencias de un perfil", async () => {
      await repository.save(
        UserTerritorialPreference.createAllCatalonia(1),
      );

      const deleted =
        await repository.deleteByUserProfileId(1);

      expect(deleted).toBe(true);

      const result =
        await repository.findByUserProfileId(1);

      expect(result).toBeNull();
    });

    // ========================================================
    // TEST 9 — ELIMINAR CONFIGURACIÓN INEXISTENTE
    // ========================================================

    it("devuelve false si no existen preferencias", async () => {
      const deleted =
        await repository.deleteByUserProfileId(999);

      expect(deleted).toBe(false);
    });

    // ========================================================
    // TEST 10 — NO ELIMINAR OTROS PERFILES
    // ========================================================

    it("no elimina las preferencias de otro perfil", async () => {
      await repository.save(
        UserTerritorialPreference.createAllCatalonia(1),
      );

      await repository.save(
        UserTerritorialPreference.createAllCatalonia(2),
      );

      await repository.deleteByUserProfileId(1);

      const first =
        await repository.findByUserProfileId(1);

      const second =
        await repository.findByUserProfileId(2);

      expect(first).toBeNull();
      expect(second).not.toBeNull();
    });

    // ========================================================
    // TEST 11 — IMPEDIR CAMBIAR PROPIETARIO
    // ========================================================

    it("impide utilizar el identificador de otro perfil", async () => {
      const saved = await repository.save(
        UserTerritorialPreference.createAllCatalonia(1),
      );

      const invalid =
        UserTerritorialPreference.restore({
          id: saved.id!,
          userProfileId: 2,
          scope: "ALL_CATALONIA",
          provinceIds: [],
          countyIds: [],
          municipalityIds: [],
        });

      await expect(
        repository.save(invalid),
      ).rejects.toThrow(
        "Las preferencias territoriales no existen",
      );

      const original =
        await repository.findByUserProfileId(1);

      expect(original?.scope).toBe("ALL_CATALONIA");
    });

    // ========================================================
    // TEST 12 — NO CREAR UNA SEGUNDA CONFIGURACIÓN
    // ========================================================

    it("mantiene una única configuración por perfil", async () => {
      await repository.save(
        UserTerritorialPreference.createAllCatalonia(1),
      );

      const updated = await repository.save(
        UserTerritorialPreference.createSelectedTerritories(
          1,
          {
            provinceIds: [2],
            countyIds: [],
            municipalityIds: [],
          },
        ),
      );

      const result =
        await repository.findByUserProfileId(1);

      expect(updated.id).toBe(1);
      expect(result?.id).toBe(1);
      expect(result?.provinceIds).toEqual([2]);
    });
  },
);
