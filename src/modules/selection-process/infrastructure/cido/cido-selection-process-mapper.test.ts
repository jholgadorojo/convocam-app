import { describe, expect, it } from "vitest";

import oposicionsPage from "./__fixtures__/oposicions-page.json";
import { mapCidoSelectionProcess } from "./cido-selection-process-mapper";
import {
  cidoSelectionProcessResourceSchema,
  cidoSelectionProcessesResponseSchema,
} from "./cido-types";

// Respuesta real de CIDO: se valida igual que en la
// sincronización antes de mapearla.
const page =
  cidoSelectionProcessesResponseSchema.parse(oposicionsPage);

function mapFixture(cidoId: string) {
  const resource = page.data
    .map((item) =>
      cidoSelectionProcessResourceSchema.parse(item),
    )
    .find((item) => item.id === cidoId);

  if (!resource) {
    throw new Error(`No hay convocatoria ${cidoId} en la fixture`);
  }

  return mapCidoSelectionProcess(resource);
}

describe("mapCidoSelectionProcess", () => {
  it("mapea una convocatoria real con plazo abierto", () => {
    expect(mapFixture("22381533")).toMatchObject({
      cidoId: "22381533",
      cidoIdentifier: expect.any(String),
      fileNumber: "26-142_MS_JC",
      publicOfferYear: null,
      title:
        "1 plaça de Strategic Communications Manager - Cardiovascular diseases research group (BIO-HEART)",
      isJobPool: false,
      applicationStartDate: new Date("2026-10-23T00:00:00.000Z"),
      applicationEndDate: new Date("2026-11-06T00:00:00.000Z"),
      applicationEndTime: null,
      selectionSystemId: 2,
      selectionSystem: "Concurs o valoració de mèrits",
      numberOfPositions: 1,
      firstExamDate: null,
      statusId: 3,
      status: "Termini obert",
      lastDocumentPublicationDate: new Date(
        "2026-10-23T00:00:00.000Z",
      ),
    });
  });

  it("conserva la hora de fin del plazo", () => {
    const selectionProcess = mapFixture("22395049");

    expect(selectionProcess.applicationStartDate).toBeNull();
    expect(selectionProcess.applicationEndDate).toEqual(
      new Date("2026-11-23T00:00:00.000Z"),
    );
    expect(selectionProcess.applicationEndTime).toBe("14:00");
  });

  it("deja en null los campos que CIDO envía vacíos", () => {
    expect(mapFixture("22394879")).toMatchObject({
      fileNumber: null,
      applicationStartDate: null,
      applicationEndDate: null,
      selectionSystemId: null,
      selectionSystem: null,
      statusId: 1,
      status: "Pendent de convocatòria",
    });
  });

  it("quita los espacios sobrantes del título", () => {
    expect(mapFixture("21548840")).toMatchObject({
      title: "1 plaça de Treballador social",
      isJobPool: true,
      publicOfferYear: 2026,
    });
  });

  it("convierte en null los textos que solo tienen espacios", () => {
    const resource = cidoSelectionProcessResourceSchema.parse(
      page.data[0],
    );

    const selectionProcess = mapCidoSelectionProcess({
      ...resource,
      attributes: {
        ...resource.attributes,
        expedient: "   ",
        observacions: "",
      },
    });

    expect(selectionProcess.fileNumber).toBeNull();
    expect(selectionProcess.observations).toBeNull();
  });
});
