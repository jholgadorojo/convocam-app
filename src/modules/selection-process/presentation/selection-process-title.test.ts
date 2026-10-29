import { describe, expect, it } from "vitest";

import { formatSelectionProcessTitle } from "./selection-process-title";

describe("formatSelectionProcessTitle", () => {
  // Títulos reales de CIDO (infrastructure/cido/__fixtures__/oposicions-page.json).
  it.each([
    [
      "1 plaça d'Encarregat del servei de neteja",
      "1 plaça d'Encarregat del Servei de Neteja",
    ],
    [
      "1 plaça de Treballador social ",
      "1 plaça de Treballador Social",
    ],
    [
      "1 plaça de Metge especialista en Psiquiatria, per a l'atenció de l'equip de tractament assertiu comunitari",
      "1 plaça de Metge Especialista en Psiquiatria, per a l'Atenció de l'Equip de Tractament Assertiu Comunitari",
    ],
  ])("da formato a «%s»", (title, expected) => {
    expect(formatSelectionProcessTitle(title)).toBe(expected);
  });

  it("normaliza un título en mayúsculas", () => {
    expect(
      formatSelectionProcessTitle("TÈCNIC/A D'ADMINISTRACIÓ GENERAL A1"),
    ).toBe("Tècnic/a d'Administració General A1");
  });

  it("mantiene en minúscula el número de plazas y los conectores", () => {
    expect(
      formatSelectionProcessTitle("2 PLACES D’AUXILIAR ADMINISTRATIU/VA, GRUP C2"),
    ).toBe("2 places d’Auxiliar Administratiu/va, Grup C2");
  });

  it("conserva las siglas conocidas", () => {
    expect(formatSelectionProcessTitle("borsa de treball de tic i sap")).toBe(
      "Borsa de Treball de TIC i SAP",
    );
  });

  it("conserva una sigla conocida después del apóstrofo", () => {
    expect(formatSelectionProcessTitle("responsable d'erp publicat al dogc")).toBe(
      "Responsable d'ERP Publicat al DOGC",
    );
  });

  it("pone en mayúscula cada parte de una palabra con guion", () => {
    expect(formatSelectionProcessTitle("tècnic socio-cultural")).toBe(
      "Tècnic Socio-Cultural",
    );
  });

  it("solo trata como descriptor «plaça» o «borsa» detrás del número inicial", () => {
    expect(formatSelectionProcessTitle("1 borsa de treball")).toBe(
      "1 borsa de Treball",
    );
    expect(formatSelectionProcessTitle("Borsa de places")).toBe(
      "Borsa de Places",
    );
  });

  it("une los espacios repetidos y recorta los extremos", () => {
    expect(formatSelectionProcessTitle("  1   plaça   de  conserge  ")).toBe(
      "1 plaça de Conserge",
    );
  });

  it("devuelve una cadena vacía si el título está vacío", () => {
    expect(formatSelectionProcessTitle("   ")).toBe("");
  });
});
