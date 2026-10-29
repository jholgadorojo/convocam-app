import { describe, expect, it } from "vitest";

import documents from "./__fixtures__/documents.json";
import institucioSinIne from "./__fixtures__/institucio-sin-ine.json";
import institucio from "./__fixtures__/institucio.json";
import materies from "./__fixtures__/materies.json";
import oposicionsPage from "./__fixtures__/oposicions-page.json";
import { cidoInstitutionResponseSchema } from "./cido-institution-types";
import { cidoSelectionProcessDocumentsResponseSchema } from "./cido-selection-process-document-types";
import { cidoSubjectAreasResponseSchema } from "./cido-subject-area-types";
import {
  cidoSelectionProcessResourceSchema,
  cidoSelectionProcessesResponseSchema,
} from "./cido-types";
import {
  parseCidoResponse,
  readCidoResourceId,
} from "./cido-validation";

const url = new URL(
  "https://api.diba.cat/dadesobertes/cido/v1/oposicions/22381533",
);

const selectionProcess = oposicionsPage.data[0];

function withAttributes(attributes: Record<string, unknown>) {
  return {
    ...selectionProcess,
    attributes: {
      ...selectionProcess.attributes,
      ...attributes,
    },
  };
}

describe("esquemas de CIDO", () => {
  it("aceptan las respuestas reales de CIDO", () => {
    const page =
      cidoSelectionProcessesResponseSchema.parse(oposicionsPage);

    expect(page.meta.totalResourceCount).toBeGreaterThan(0);

    for (const item of page.data) {
      expect(
        cidoSelectionProcessResourceSchema.safeParse(item).success,
      ).toBe(true);
    }

    expect(
      cidoInstitutionResponseSchema.safeParse(institucio).success,
    ).toBe(true);
    expect(
      cidoInstitutionResponseSchema.safeParse(institucioSinIne)
        .success,
    ).toBe(true);
    expect(
      cidoSubjectAreasResponseSchema.safeParse(materies).success,
    ).toBe(true);
    expect(
      cidoSelectionProcessDocumentsResponseSchema.safeParse(documents)
        .success,
    ).toBe(true);
  });

  it("descartan los campos que no se usan", () => {
    const resource =
      cidoSelectionProcessResourceSchema.parse(selectionProcess);

    expect(resource.attributes).not.toHaveProperty("urlGoogleMaps");
    expect(resource).not.toHaveProperty("links");
  });

  it.each([
    ["una fecha con otro formato", { dataFinalitzacio: "06/11/2026" }],
    ["una fecha imposible", { dataFinalitzacio: "2026-02-30" }],
    ["un campo obligatorio ausente", { titol: undefined }],
    ["un tipo incorrecto", { numPlaces: "1" }],
  ])("rechazan una convocatoria con %s", (_, attributes) => {
    expect(
      cidoSelectionProcessResourceSchema.safeParse(
        withAttributes(attributes),
      ).success,
    ).toBe(false);
  });
});

describe("parseCidoResponse", () => {
  it("devuelve los datos validados", () => {
    const response = parseCidoResponse(
      institucio,
      cidoInstitutionResponseSchema,
      url,
    );

    expect(response.data?.id).toBe("700332");
  });

  it("indica el endpoint y el campo que no es válido", () => {
    expect(() =>
      parseCidoResponse(
        { data: withAttributes({ dataFinalitzacio: "06/11/2026" }) },
        cidoInstitutionResponseSchema,
        url,
      ),
    ).toThrow(
      "Respuesta de CIDO no válida en /dadesobertes/cido/v1/oposicions/22381533",
    );

    expect(() =>
      parseCidoResponse(
        { data: [], meta: {} },
        cidoSelectionProcessesResponseSchema,
        url,
      ),
    ).toThrow(/meta\.totalResourceCount/);
  });
});

describe("readCidoResourceId", () => {
  it("devuelve el id del recurso", () => {
    expect(readCidoResourceId({ id: "123" })).toBe("123");
  });

  it.each([
    ["no es un objeto", "texto"],
    ["es null", null],
    ["no tiene id", {}],
    ["tiene un id que no es texto", { id: 123 }],
  ])("devuelve «desconocido» si el recurso %s", (_, resource) => {
    expect(readCidoResourceId(resource)).toBe("desconocido");
  });
});
