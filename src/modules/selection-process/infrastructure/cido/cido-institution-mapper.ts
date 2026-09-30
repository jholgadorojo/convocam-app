import type { InstitutionSyncData } from "../../application/institution-sync-data";
import type { CidoInstitutionResource } from "./cido-institution-types";

export function mapCidoInstitution(
  resource: CidoInstitutionResource,
): InstitutionSyncData {
  const attributes = resource.attributes;

  const name =
    attributes.institucioDesenvolupat.trim();

  return {
    cidoId: resource.id,

    name,

    shortName:
      cleanString(attributes.institucioAbreujat) ??
      name,

    isActive:
      attributes.institucioActiva,

    latitude:
      attributes.latitud,

    longitude:
      attributes.longitud,

    ineCode:
      toCode(attributes.codiIne),

    address:
      cleanString(attributes.adreca),

    postalCode:
      toPostalCode(attributes.codiPostal),

    municipality:
      cleanString(attributes.municipi),

    countyCode:
      toCode(attributes.codiComarca),

    county:
      cleanString(attributes.comarca),

    provinceCode:
      toCode(attributes.codiProvincia),

    province:
      cleanString(attributes.provincia),

    contractorProfileUrl:
      cleanString(
        attributes.urlPerfilContractant,
      ),

    socCode:
      toCode(attributes.soc),

    sepeCode:
      toCode(attributes.sepe),
  };
}

function cleanString(
  value: string | null,
): string | null {
  if (value === null) {
    return null;
  }

  const cleaned = value.trim();

  return cleaned.length > 0
    ? cleaned
    : null;
}

function toCode(
  value: string | number | null,
): string | null {
  if (value === null) {
    return null;
  }

  const code = String(value).trim();

  return code.length > 0
    ? code
    : null;
}

function toPostalCode(
  value: string | number | null,
): string | null {
  if (value === null) {
    return null;
  }

  const postalCode =
    String(value).trim();

  if (postalCode.length === 0) {
    return null;
  }

  if (typeof value === "number") {
    return postalCode.padStart(5, "0");
  }

  return postalCode;
}