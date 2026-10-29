import { describe, expect, it } from "vitest";

import institucioSinIne from "./__fixtures__/institucio-sin-ine.json";
import institucio from "./__fixtures__/institucio.json";
import { mapCidoInstitution } from "./cido-institution-mapper";
import { cidoInstitutionResponseSchema } from "./cido-institution-types";

// Respuestas reales de CIDO, validadas igual que en la
// sincronización antes de mapearlas.
function parseFixture(json: unknown) {
  const { data } = cidoInstitutionResponseSchema.parse(json);

  if (!data) {
    throw new Error("La fixture no tiene institución");
  }

  return data;
}

describe("mapCidoInstitution", () => {
  it("mapea una institución real", () => {
    expect(mapCidoInstitution(parseFixture(institucio))).toEqual({
      cidoId: "700332",
      name: "Institut d'Investigació Biomèdica de Bellvitge (IDIBELL)",
      shortName: "Institut d'Investigació Biomèdica de Bellvitge",
      isActive: true,
      latitude: 41.345956,
      longitude: 2.1115808,
      // CIDO envía 0 cuando no hay código INE; la consulta
      // de municipios lo descarta al no ser un código catalán.
      ineCode: "0",
      // CIDO separa el número con un espacio no separable (U+00A0).
      address: "Av. Gran Via de l'Hospitalet, 199-203",
      postalCode: "08907",
      municipality: "L'Hospitalet de Llobregat",
      countyCode: "8101150006",
      county: "Baix Llobregat",
      provinceCode: "8000840003",
      province: "Barcelona",
      contractorProfileUrl:
        "https://contractaciopublica.gencat.cat/ecofin_pscp/AppJava/cap.pscp?reqCode=viewDetail&idCap=5624359",
      socCode: "81017",
      sepeCode: "8",
    });
  });

  it("conserva los campos nulos", () => {
    expect(
      mapCidoInstitution(parseFixture(institucioSinIne)),
    ).toMatchObject({
      cidoId: "17492965",
      ineCode: null,
      contractorProfileUrl: null,
      postalCode: "08515",
    });
  });

  it("usa el nombre completo cuando no hay nombre abreviado", () => {
    const resource = parseFixture(institucio);

    const institution = mapCidoInstitution({
      ...resource,
      attributes: {
        ...resource.attributes,
        institucioAbreujat: "  ",
      },
    });

    expect(institution.shortName).toBe(
      "Institut d'Investigació Biomèdica de Bellvitge (IDIBELL)",
    );
  });

  it("mantiene los códigos que llegan como texto y convierte en null los vacíos", () => {
    const resource = parseFixture(institucio);

    const institution = mapCidoInstitution({
      ...resource,
      attributes: {
        ...resource.attributes,
        codiPostal: " 08907 ",
        codiIne: "",
        adreca: "",
      },
    });

    expect(institution.postalCode).toBe("08907");
    expect(institution.ineCode).toBeNull();
    expect(institution.address).toBeNull();
  });
});
