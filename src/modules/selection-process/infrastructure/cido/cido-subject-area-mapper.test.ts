import { describe, expect, it } from "vitest";

import materies from "./__fixtures__/materies.json";
import { mapCidoSubjectArea } from "./cido-subject-area-mapper";
import { cidoSubjectAreasResponseSchema } from "./cido-subject-area-types";

describe("mapCidoSubjectArea", () => {
  it("mapea las materias reales de una convocatoria", () => {
    // Respuesta real de CIDO, validada igual que en la
    // sincronización antes de mapearla.
    const { data } = cidoSubjectAreasResponseSchema.parse(materies);

    expect(data.map(mapCidoSubjectArea)).toEqual([
      { cidoId: "141", name: "Recerca / Laboratori", cidoModuleId: 4 },
      { cidoId: "179", name: "Comunicació", cidoModuleId: 4 },
      {
        cidoId: "181",
        name: "Relacions públiques / Publicitat",
        cidoModuleId: 4,
      },
    ]);
  });

  it("quita los espacios sobrantes del nombre", () => {
    expect(
      mapCidoSubjectArea({
        id: "1",
        type: "materies",
        attributes: { materia: " Informàtica ", idModul: 4 },
      }),
    ).toEqual({ cidoId: "1", name: "Informàtica", cidoModuleId: 4 });
  });
});
