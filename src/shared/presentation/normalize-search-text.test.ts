import { describe, expect, it } from "vitest";

import { normalizeSearchText } from "./normalize-search-text";

describe("normalizeSearchText", () => {
  it("quita tildes y diacríticos del catalán y el castellano", () => {
    expect(normalizeSearchText("Tècnic d'Informàtica")).toBe("tecnic d'informatica");
    expect(normalizeSearchText("Educación Física")).toBe("educacion fisica");
    expect(normalizeSearchText("Pinós · Solsonès")).toBe("pinos · solsones");
  });

  it("pasa a minúsculas y recorta los espacios de los extremos", () => {
    expect(normalizeSearchText("  LLEIDA ")).toBe("lleida");
  });

  it("conserva la ç y la ñ sin su signo", () => {
    expect(normalizeSearchText("Plaça d'Espanya")).toBe("placa d'espanya");
    expect(normalizeSearchText("Logroño")).toBe("logrono");
  });
});
