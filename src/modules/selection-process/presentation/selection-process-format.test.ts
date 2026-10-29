import { describe, expect, it } from "vitest";

import {
  formatInstitutionLocation,
  formatNumberOfPositions,
} from "./selection-process-format";

describe("formatNumberOfPositions", () => {
  it("muestra las plazas de una plaza de plantilla", () => {
    expect(formatNumberOfPositions(3, false)).toBe("3");
  });

  it("no muestra plazas en una bolsa de trabajo", () => {
    expect(formatNumberOfPositions(3, true)).toBe("—");
  });

  it.each([null, 0, -1])("indica «Sin definir» si las plazas son %s", (value) => {
    expect(formatNumberOfPositions(value, false)).toBe("Sin definir");
  });
});

describe("formatInstitutionLocation", () => {
  it("une municipio, comarca y provincia omitiendo los vacíos", () => {
    expect(
      formatInstitutionLocation({
        municipality: "Terrassa",
        county: "",
        province: "Barcelona",
      }),
    ).toBe("Terrassa · Barcelona");
  });

  it("indica que no hay ubicación sin institución o sin datos", () => {
    expect(formatInstitutionLocation(null)).toBe("Ubicación no disponible");
    expect(
      formatInstitutionLocation({
        municipality: null,
        county: null,
        province: null,
      }),
    ).toBe("Ubicación no disponible");
  });
});
