import { describe, expect, it } from "vitest";

import {
  getMatchReasons,
  locationText,
  pageHref,
  parsePage,
} from "./for-me-presentation";

describe("parsePage", () => {
  it("devuelve la página indicada en la URL", () => {
    expect(parsePage("3")).toBe(3);
    expect(parsePage(["2", "5"])).toBe(2);
  });

  it.each([
    ["falta", undefined],
    ["está vacía", ""],
    ["no es un número", "abc"],
    ["es cero", "0"],
    ["es negativa", "-2"],
    ["tiene decimales", "1.5"],
  ])("devuelve 1 si la página %s", (_, value) => {
    expect(parsePage(value)).toBe(1);
  });
});

describe("pageHref", () => {
  it("omite la primera página", () => {
    expect(pageHref(1, null, null)).toBe("/para-mi");
    expect(pageHref(2, null, null)).toBe("/para-mi?page=2");
  });

  it("conserva el municipio y la provincia seleccionados", () => {
    expect(pageHref(2, "Sant Boi de Llobregat", "Barcelona")).toBe(
      "/para-mi?page=2&municipality=Sant+Boi+de+Llobregat&province=Barcelona",
    );
  });

  it("ignora la provincia si no hay municipio", () => {
    expect(pageHref(1, null, "Barcelona")).toBe("/para-mi");
  });
});

describe("locationText", () => {
  it("une municipio y comarca", () => {
    expect(
      locationText({ municipality: "Olost", county: "Lluçanès" }),
    ).toBe("Olost · Lluçanès");
  });

  it("muestra solo el dato disponible", () => {
    expect(locationText({ municipality: "Olost", county: null })).toBe(
      "Olost",
    );
  });

  it("avisa cuando no hay ubicación", () => {
    expect(locationText(null)).toBe(
      "Ubicación del organismo no disponible",
    );
    expect(locationText({ municipality: null, county: null })).toBe(
      "Ubicación del organismo no disponible",
    );
  });
});

describe("getMatchReasons", () => {
  it("devuelve todos los motivos cuando hay preferencias de todo tipo", () => {
    expect(
      getMatchReasons(
        { scope: "SELECTED_TERRITORIES" },
        {
          selectionProcessType: "POSITIONS",
          subjectAreaIds: [1],
          qualificationGroups: ["A1"],
        },
      ),
    ).toEqual([
      "Ubicación del organismo",
      "Plazas de plantilla",
      "Materias profesionales",
      "Grupo de titulación",
    ]);
  });

  it("indica bolsas de trabajo cuando es el tipo preferido", () => {
    expect(
      getMatchReasons(null, {
        selectionProcessType: "JOB_POOLS",
        subjectAreaIds: [],
        qualificationGroups: [],
      }),
    ).toEqual(["Bolsas de trabajo"]);
  });

  it("no añade motivos para toda Cataluña ni para ambos tipos", () => {
    expect(
      getMatchReasons(
        { scope: "ALL_CATALONIA" },
        {
          selectionProcessType: "BOTH",
          subjectAreaIds: [],
          qualificationGroups: [],
        },
      ),
    ).toEqual([]);
  });

  it("no devuelve motivos sin preferencias", () => {
    expect(getMatchReasons(null, null)).toEqual([]);
  });
});
