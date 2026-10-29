import {
  cidoSelectionProcessesResponseSchema,
  cidoSelectionProcessResponseSchema,
  type CidoSelectionProcessesResponse,
  type CidoSelectionProcessResponse,
} from "./cido-types";

import {
  cidoInstitutionResponseSchema,
  type CidoInstitutionResponse,
} from "./cido-institution-types";
import {
  cidoSubjectAreasResponseSchema,
  type CidoSubjectAreasResponse,
} from "./cido-subject-area-types";
import {
  cidoSelectionProcessDocumentsResponseSchema,
  type CidoSelectionProcessDocumentsResponse,
} from "./cido-selection-process-document-types";
import { parseCidoResponse } from "./cido-validation";

const CIDO_API_BASE_URL =
  "https://api.diba.cat/dadesobertes/cido/v1";

// CIDO suele responder en 2-3 s (también con páginas de 500
// convocatorias). Sin límite, una petición colgada bloquearía
// la sincronización completa indefinidamente.
const CIDO_REQUEST_TIMEOUT_MS = 30_000;

// La sincronización completa hace miles de peticiones (unos 40 min):
// un fallo puntual no debe interrumpirla. Se reintentan los timeouts,
// los errores de red y las respuestas 429/5xx, esperando entre intentos.
// Los 404 y demás 4xx son definitivos y se devuelven sin reintentar.
const CIDO_RETRY_DELAYS_MS = [2_000, 5_000];

async function fetchCido(url: URL): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    const canRetry = attempt < CIDO_RETRY_DELAYS_MS.length;
    let failure: string;

    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/vnd.api+json",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(CIDO_REQUEST_TIMEOUT_MS),
      });

      if (!canRetry || !isTransientStatus(response.status)) {
        return response;
      }

      // Liberar la conexión de la respuesta descartada.
      await response.body?.cancel();
      failure = `HTTP ${response.status}`;
    } catch (error) {
      const cidoError = toCidoError(error, url);

      if (!canRetry) {
        throw cidoError;
      }

      failure = cidoError instanceof Error ? cidoError.message : String(cidoError);
    }

    const delay = CIDO_RETRY_DELAYS_MS[attempt];

    console.warn(
      `CIDO: ${failure} en ${url.pathname}. Reintento ${attempt + 1} de ${CIDO_RETRY_DELAYS_MS.length} en ${delay / 1000} s.`,
    );

    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}

function isTransientStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

function toCidoError(error: unknown, url: URL): unknown {
  if (
    error instanceof DOMException &&
    error.name === "TimeoutError"
  ) {
    return new Error(
      `CIDO no ha respondido en ${CIDO_REQUEST_TIMEOUT_MS / 1000} s: ${url.pathname}`,
    );
  }

  return error;
}

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

  const response = await fetchCido(url);

  if (!response.ok) {
    throw new Error(
      `Error consultando CIDO: ${response.status} ${response.statusText}`,
    );
  }

  return parseCidoResponse(
    await response.json(),
    cidoSelectionProcessesResponseSchema,
    url,
  );
}

export async function getCidoInstitution(
  selectionProcessCidoId: string,
): Promise<CidoInstitutionResponse> {
  const url = new URL(
    `${CIDO_API_BASE_URL}/oposicions/${encodeURIComponent(
      selectionProcessCidoId,
    )}/institucio`,
  );

  const response = await fetchCido(url);

  if (!response.ok) {
    throw new Error(
      `Error consultando la institución en CIDO: ${response.status} ${response.statusText}`,
    );
  }

  return parseCidoResponse(
    await response.json(),
    cidoInstitutionResponseSchema,
    url,
  );
}

export async function getCidoSubjectAreas(
  selectionProcessCidoId: string,
): Promise<CidoSubjectAreasResponse> {
  const url = new URL(
    `${CIDO_API_BASE_URL}/oposicions/${encodeURIComponent(
      selectionProcessCidoId,
    )}/materies`,
  );

  const response = await fetchCido(url);

  if (!response.ok) {
    throw new Error(
      `Error consultando las materias en CIDO: ${response.status} ${response.statusText}`,
    );
  }

  return parseCidoResponse(
    await response.json(),
    cidoSubjectAreasResponseSchema,
    url,
  );
}
export async function getCidoSelectionProcessDocuments(
  selectionProcessCidoId: string,
): Promise<CidoSelectionProcessDocumentsResponse> {
  const url = new URL(
    `${CIDO_API_BASE_URL}/oposicions/${encodeURIComponent(
      selectionProcessCidoId,
    )}/documents`,
  );

  const response = await fetchCido(url);

  if (!response.ok) {
    throw new Error(
      `Error consultando los documentos en CIDO: ${response.status} ${response.statusText}`,
    );
  }

  return parseCidoResponse(
    await response.json(),
    cidoSelectionProcessDocumentsResponseSchema,
    url,
  );
}
export async function getCidoSelectionProcessById(
  cidoId: string,
): Promise<CidoSelectionProcessResponse> {
  const url = new URL(
    `${CIDO_API_BASE_URL}/oposicions/${encodeURIComponent(
      cidoId,
    )}`,
  );

  const response = await fetchCido(url);

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

  return parseCidoResponse(
    await response.json(),
    cidoSelectionProcessResponseSchema,
    url,
  );
}