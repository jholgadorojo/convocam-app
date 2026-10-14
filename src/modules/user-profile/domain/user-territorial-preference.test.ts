
import { describe, expect, it } from "vitest";

import { UserTerritorialPreference } from "./user-territorial-preference";

describe("UserTerritorialPreference", () => {
  it("crea una preferencia para toda Catalunya", () => {
    const preference =
      UserTerritorialPreference.createAllCatalonia(1);

    expect(preference.id).toBeUndefined();
    expect(preference.userProfileId).toBe(1);
    expect(preference.scope).toBe("ALL_CATALONIA");
    expect(preference.provinceIds).toEqual([]);
    expect(preference.countyIds).toEqual([]);
    expect(preference.municipalityIds).toEqual([]);
  });

  it("crea una preferencia con territorios combinados", () => {
    const preference =
      UserTerritorialPreference.createSelectedTerritories(
        1,
        {
          provinceIds: [1],
          countyIds: [5, 8],
          municipalityIds: [20],
        },
      );

    expect(preference.scope).toBe(
      "SELECTED_TERRITORIES",
    );
    expect(preference.provinceIds).toEqual([1]);
    expect(preference.countyIds).toEqual([5, 8]);
    expect(preference.municipalityIds).toEqual([20]);
  });

  it("elimina identificadores duplicados", () => {
    const preference =
      UserTerritorialPreference.createSelectedTerritories(
        1,
        {
          provinceIds: [1, 1, 2],
          countyIds: [5, 5],
          municipalityIds: [],
        },
      );

    expect(preference.provinceIds).toEqual([1, 2]);
    expect(preference.countyIds).toEqual([5]);
  });

  it("permite seleccionar únicamente municipios", () => {
    const preference =
      UserTerritorialPreference.createSelectedTerritories(
        1,
        {
          provinceIds: [],
          countyIds: [],
          municipalityIds: [10, 15],
        },
      );

    expect(preference.municipalityIds).toEqual([10, 15]);
  });

  it("rechaza una selección de territorios vacía", () => {
    expect(() =>
      UserTerritorialPreference.createSelectedTerritories(
        1,
        {
          provinceIds: [],
          countyIds: [],
          municipalityIds: [],
        },
      ),
    ).toThrow(
      "Debes seleccionar al menos un territorio",
    );
  });

  it("rechaza identificadores territoriales inválidos", () => {
    expect(() =>
      UserTerritorialPreference.createSelectedTerritories(
        1,
        {
          provinceIds: [0],
          countyIds: [],
          municipalityIds: [],
        },
      ),
    ).toThrow(
      "El identificador territorial no es válido",
    );
  });

  it("rechaza un perfil inválido", () => {
    expect(() =>
      UserTerritorialPreference.createAllCatalonia(0),
    ).toThrow(
      "El identificador del perfil no es válido",
    );
  });

  it("recupera una preferencia existente", () => {
    const preference =
      UserTerritorialPreference.restore({
        id: 10,
        userProfileId: 1,
        scope: "SELECTED_TERRITORIES",
        provinceIds: [1],
        countyIds: [],
        municipalityIds: [20],
      });

    expect(preference.id).toBe(10);
    expect(preference.provinceIds).toEqual([1]);
    expect(preference.municipalityIds).toEqual([20]);
  });

  it("cambia de territorios seleccionados a toda Catalunya", () => {
    const preference =
      UserTerritorialPreference.createSelectedTerritories(
        1,
        {
          provinceIds: [1],
          countyIds: [5],
          municipalityIds: [],
        },
      );

    preference.selectAllCatalonia();

    expect(preference.scope).toBe("ALL_CATALONIA");
    expect(preference.provinceIds).toEqual([]);
    expect(preference.countyIds).toEqual([]);
    expect(preference.municipalityIds).toEqual([]);
  });

  it("cambia de toda Catalunya a territorios seleccionados", () => {
    const preference =
      UserTerritorialPreference.createAllCatalonia(1);

    preference.selectTerritories({
      provinceIds: [],
      countyIds: [5],
      municipalityIds: [20],
    });

    expect(preference.scope).toBe(
      "SELECTED_TERRITORIES",
    );
    expect(preference.countyIds).toEqual([5]);
    expect(preference.municipalityIds).toEqual([20]);
  });

  it("conserva los valores si la modificación es inválida", () => {
    const preference =
      UserTerritorialPreference.createSelectedTerritories(
        1,
        {
          provinceIds: [1],
          countyIds: [],
          municipalityIds: [],
        },
      );

    expect(() =>
      preference.selectTerritories({
        provinceIds: [],
        countyIds: [],
        municipalityIds: [],
      }),
    ).toThrow();

    expect(preference.scope).toBe(
      "SELECTED_TERRITORIES",
    );
    expect(preference.provinceIds).toEqual([1]);
  });

  it("no permite modificar sus arrays desde fuera", () => {
    const preference =
      UserTerritorialPreference.createSelectedTerritories(
        1,
        {
          provinceIds: [1],
          countyIds: [],
          municipalityIds: [],
        },
      );

    const ids = preference.provinceIds;
    ids.push(99);

    expect(preference.provinceIds).toEqual([1]);
  });

  it("rechaza una preferencia restaurada inconsistente", () => {
    expect(() =>
      UserTerritorialPreference.restore({
        id: 10,
        userProfileId: 1,
        scope: "ALL_CATALONIA",
        provinceIds: [1],
        countyIds: [],
        municipalityIds: [],
      }),
    ).toThrow(
      "Toda Catalunya no puede tener territorios seleccionados",
    );
  });
});
