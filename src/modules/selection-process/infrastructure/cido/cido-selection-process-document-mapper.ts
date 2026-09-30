import type { SelectionProcessDocumentSyncData } from "../../application/selection-process-document-sync-data";
import type { CidoSelectionProcessDocumentResource } from "./cido-selection-process-document-types";

export function mapCidoSelectionProcessDocument(
  resource: CidoSelectionProcessDocumentResource,
): SelectionProcessDocumentSyncData {
  const attributes = resource.attributes;

  const documentUrl =
    cleanString(attributes.urlPdf) ??
    cleanString(attributes.urlHtml);

  if (!documentUrl) {
    throw new Error(
      `El documento CIDO ${resource.id} no tiene URL`,
    );
  }

  return {
    cidoId: resource.id,

    publicationDate:
      toDate(attributes.dataPublicacio),

    summary:
      attributes.resum.trim(),

    publisher:
      cleanString(attributes.anunciant),

    bulletinId:
      attributes.idButlleti,

    bulletin:
      attributes.butlleti.trim(),

    bulletinNumber:
      attributes.numButlleti,

    entryDate:
      toDate(attributes.dataEntrada),

    phaseId:
      attributes.idFase,

    phase:
      attributes.fase.trim(),

    phaseNotes:
      cleanString(
        attributes.observacionsFase,
      ),

    documentUrl,

    htmlUrl:
      cleanString(attributes.urlHtml),
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

function toDate(
  value: string,
): Date {
  return new Date(
    `${value}T00:00:00.000Z`,
  );
}