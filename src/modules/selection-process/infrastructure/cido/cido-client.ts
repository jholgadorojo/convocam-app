import type {
  CidoSelectionProcessesResponse,
  CidoSelectionProcessResponse,
} from "./cido-types";

import type { CidoInstitutionResponse } from "./cido-institution-types";
import type { CidoSubjectAreasResponse } from "./cido-subject-area-types";
import type { CidoSelectionProcessDocumentsResponse } from "./cido-selection-process-document-types";

const CIDO_API_BASE_URL =
  "https://api.diba.cat/dadesobertes/cido/v1";

type GetSelectionProcessesParams = {
  limit?: number;
  offset?: number;
};

export async function getCidoSelectionProcesses({
  limit = 5,
  offset = 0,
}: GetSelectionProcessesParams = {}): Promise<CidoSelectionProcessesResponse> {
  const url = new URL(
    `${CIDO_API_BASE_URL}/oposicions`,
  );

  url.searchParams.set(
    "filter[idEstat]",
    "1,2,3",
  );

  url.searchParams.set(
    "page[limit]",
    String(limit),
  );

  url.searchParams.set(
    "page[offset]",
    String(offset),
  );

  url.searchParams.set(
    "sort",
    "-documents.dataPublicacio",
  );

  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.api+json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Error consultando CIDO: ${response.status} ${response.statusText}`,
    );
  }

  return response.json() as Promise<CidoSelectionProcessesResponse>;
}

export async function getCidoInstitution(
  selectionProcessCidoId: string,
): Promise<CidoInstitutionResponse> {
  const url = new URL(
    `${CIDO_API_BASE_URL}/oposicions/${encodeURIComponent(
      selectionProcessCidoId,
    )}/institucio`,
  );

  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.api+json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Error consultando la institución en CIDO: ${response.status} ${response.statusText}`,
    );
  }

  return response.json() as Promise<CidoInstitutionResponse>;
}

export async function getCidoSubjectAreas(
  selectionProcessCidoId: string,
): Promise<CidoSubjectAreasResponse> {
  const url = new URL(
    `${CIDO_API_BASE_URL}/oposicions/${encodeURIComponent(
      selectionProcessCidoId,
    )}/materies`,
  );

  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.api+json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Error consultando las materias en CIDO: ${response.status} ${response.statusText}`,
    );
  }

  return response.json() as Promise<CidoSubjectAreasResponse>;
}
export async function getCidoSelectionProcessDocuments(
  selectionProcessCidoId: string,
): Promise<CidoSelectionProcessDocumentsResponse> {
  const url = new URL(
    `${CIDO_API_BASE_URL}/oposicions/${encodeURIComponent(
      selectionProcessCidoId,
    )}/documents`,
  );

  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.api+json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Error consultando los documentos en CIDO: ${response.status} ${response.statusText}`,
    );
  }

  return response.json() as Promise<CidoSelectionProcessDocumentsResponse>;
}
export async function getCidoSelectionProcessById(
  cidoId: string,
): Promise<CidoSelectionProcessResponse> {
  const url = new URL(
    `${CIDO_API_BASE_URL}/oposicions/${encodeURIComponent(
      cidoId,
    )}`,
  );

  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.api+json",
    },
    cache: "no-store",
  });

  if (response.status === 404) {
    return {
      data: null,
    };
  }

  if (!response.ok) {
    throw new Error(
      `Error consultando la convocatoria ${cidoId} en CIDO: ${response.status} ${response.statusText}`,
    );
  }

  return response.json() as Promise<CidoSelectionProcessResponse>;
}