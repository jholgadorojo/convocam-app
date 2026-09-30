import type { SelectionProcessSyncData } from "../../application/selection-process-sync-data";

import type {
  CidoSelectionProcessResource,
} from "./cido-types";

export function mapCidoSelectionProcess(
  resource: CidoSelectionProcessResource,
): SelectionProcessSyncData {
  const attributes = resource.attributes;

  return {
    cidoId: resource.id,
    cidoIdentifier: attributes.identificador,
    fileNumber: cleanString(attributes.expedient),
    publicOfferYear: attributes.anyOpo,

    title: attributes.titol.trim(),
    isJobPool: attributes.borsaTreball,
    scopeId: attributes.idAmbit,
    scopeName: attributes.ambit.trim(),
    institutionName:
      attributes.institucioDesenvolupat.trim(),

    applicationStartDate:
      toDateOrNull(attributes.dataInici),

    applicationEndDate:
      toDateOrNull(attributes.dataFinalitzacio),

    applicationEndTime:
      cleanString(attributes.horaFinalitzacio),

    applicationDeadlineNotes:
      cleanString(attributes.observacionsTermini),

    selectionSystemId:
      attributes.idSistemaSeleccio,

    selectionSystem:
      cleanString(attributes.sistemaSeleccio),

    personnelTypeId:
      attributes.idTipusPersonal,

    personnelType:
      cleanString(attributes.tipusPersonal),

    qualificationGroupId:
      attributes.idGrupTitulacio,

    qualificationGroup:
      cleanString(attributes.grupTitulacio),

    requiredQualification:
      cleanString(attributes.titulacioRequerida),

    otherRequirements:
      cleanString(attributes.altresRequisits),

    numberOfPositions:
      attributes.numPlaces,

    reservedDisabilityPositions:
      attributes.placesReservadesDiscapacitat,

    reservedUnemployed:
      attributes.placesReservadesAtur,

    reservedYoung:
      attributes.placesReservadesJoves,

    reservedWomen:
      attributes.placesReservadesDones,

    firstExamDate:
      toDateOrNull(attributes.dataProva),

    observations:
      cleanString(attributes.observacions),

    institutionUrl:
      cleanString(attributes.urlWeb),

    applicationUrl:
      cleanString(attributes.accesTramit),

    cidoUrl:
      attributes.urlCido,

    statusId:
      attributes.idEstat,

    status:
      attributes.estat.trim(),

    lastDocumentPublicationDate:
      toDateOrNull(
        attributes.maxDataPublicacioDocument,
      ),
  };
}

function cleanString(
  value: string | null,
): string | null {
  if (value === null) {
    return null;
  }

  const cleanedValue = value.trim();

  return cleanedValue.length > 0
    ? cleanedValue
    : null;
}

function toDateOrNull(
  value: string | null,
): Date | null {
  if (value === null) {
    return null;
  }

  return new Date(`${value}T00:00:00.000Z`);
}