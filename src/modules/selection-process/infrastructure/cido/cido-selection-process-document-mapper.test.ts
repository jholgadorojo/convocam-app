import { describe, expect, it } from "vitest";

import documents from "./__fixtures__/documents.json";
import { mapCidoSelectionProcessDocument } from "./cido-selection-process-document-mapper";
import { cidoSelectionProcessDocumentsResponseSchema } from "./cido-selection-process-document-types";

// Respuesta real de CIDO, validada igual que en la
// sincronización antes de mapearla.
const { data } =
  cidoSelectionProcessDocumentsResponseSchema.parse(documents);

function findFixture(cidoId: string) {
  const resource = data.find((item) => item.id === cidoId);

  if (!resource) {
    throw new Error(`No hay documento ${cidoId} en la fixture`);
  }

  return resource;
}

describe("mapCidoSelectionProcessDocument", () => {
  it("mapea los documentos reales de una convocatoria", () => {
    expect(data.map(mapCidoSelectionProcessDocument)).toHaveLength(3);
  });

  it("mapea un documento real con observaciones de fase", () => {
    expect(
      mapCidoSelectionProcessDocument(findFixture("22020663")),
    ).toMatchObject({
      cidoId: "22020663",
      publicationDate: new Date("2026-07-30T00:00:00.000Z"),
      entryDate: new Date("2026-07-31T00:00:00.000Z"),
      bulletinId: 91,
      bulletin: "TA",
      bulletinNumber: 0,
      phaseId: 31,
      phase: "Llista d'admesos i exclosos",
      phaseNotes: "Provisional",
      documentUrl:
        "https://educacio.vilafranca.cat/sites/default/files/2026-07/Llista_provisional_baremacio_TurismeIMF2026.pdf",
      htmlUrl: null,
    });
  });

  it("deja en null las observaciones de fase que no vienen", () => {
    expect(
      mapCidoSelectionProcessDocument(findFixture("21299229"))
        .phaseNotes,
    ).toBeNull();
  });

  it("usa la URL HTML cuando no hay PDF", () => {
    const resource = findFixture("22020663");

    const document = mapCidoSelectionProcessDocument({
      ...resource,
      attributes: {
        ...resource.attributes,
        urlPdf: null,
        urlHtml: "https://example.com/anunci.html",
      },
    });

    expect(document.documentUrl).toBe(
      "https://example.com/anunci.html",
    );
    expect(document.htmlUrl).toBe(
      "https://example.com/anunci.html",
    );
  });

  it("falla si el documento no tiene ninguna URL", () => {
    const resource = findFixture("22020663");

    expect(() =>
      mapCidoSelectionProcessDocument({
        ...resource,
        attributes: {
          ...resource.attributes,
          urlPdf: " ",
          urlHtml: null,
        },
      }),
    ).toThrow("El documento CIDO 22020663 no tiene URL");
  });
});
