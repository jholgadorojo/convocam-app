
import { describe, expect, it, vi } from "vitest";

import type {
  DashboardLatestPublicationItem,
  DashboardLatestPublicationsQuery,
  DashboardQueryRepository,
} from "./dashboard-query-repository";

import { GetDashboardLatestPublications } from
  "./get-dashboard-latest-publications";

/**
 * ============================================================
 * SPEC-009 — DASHBOARD DEL OPOSITOR
 * ============================================================
 *
 * Pruebas unitarias de:
 * GetDashboardLatestPublications
 *
 * Comprobamos que el caso de uso:
 *
 * - Identifica correctamente al usuario.
 * - Solicita un máximo de 5 publicaciones.
 * - Devuelve los documentos obtenidos.
 * - Admite varios documentos de una convocatoria.
 * - Gestiona listas vacías.
 * - Valida el identificador de usuario.
 * - Propaga los errores del repositorio.
 *
 * No necesita conexión a PostgreSQL.
 */

/**
 * Crear una publicación oficial ficticia.
 */
function createPublication(
  documentId: number,
  selectionProcessId = 100,
): DashboardLatestPublicationItem {
  return {
    documentId,

    selectionProcessId,

    selectionProcessTitle:
      `Convocatoria de prueba ${selectionProcessId}`,

    municipality: "Municipio de prueba",

    publicationDate: new Date(
      "2026-10-18T00:00:00.000Z",
    ),

    summary:
      `Documento oficial de prueba ${documentId}`,

    phase: "Convocatoria",

    documentUrl:
      `https://example.com/documento-${documentId}.pdf`,
  };
}

/**
 * Preparar el caso de uso con un repositorio simulado.
 *
 * El repositorio incluye las cuatro operaciones
 * exigidas por DashboardQueryRepository.
 *
 * En estas pruebas solamente utilizamos
 * listLatestOfficialPublications.
 */
function createTestContext(
  options: {
    publications?: DashboardLatestPublicationItem[];
  } = {},
) {
  const listLatestOfficialPublications = vi.fn(
    async (
      _query: DashboardLatestPublicationsQuery,
    ): Promise<DashboardLatestPublicationItem[]> => {
      return options.publications ?? [];
    },
  );

  const repository: DashboardQueryRepository = {
    countFollowedByUser: vi.fn(
      async () => 0,
    ),

    countUpcomingDeadlines: vi.fn(
      async () => 0,
    ),

    listUpcomingDeadlines: vi.fn(
      async () => [],
    ),

    listLatestOfficialPublications,
  };

  const useCase =
    new GetDashboardLatestPublications(
      repository,
    );

  return {
    useCase,
    listLatestOfficialPublications,
  };
}

describe("GetDashboardLatestPublications", () => {
  /**
   * ============================================================
   * 1. USUARIO Y LÍMITE
   * ============================================================
   */
  it("solicita las cinco publicaciones del usuario indicado", async () => {
    const context = createTestContext();

    await context.useCase.execute({
      userId: "user-1",
    });

    expect(
      context.listLatestOfficialPublications,
    ).toHaveBeenCalledTimes(1);

    expect(
      context.listLatestOfficialPublications,
    ).toHaveBeenCalledWith({
      userId: "user-1",
      limit: 5,
    });
  });

  /**
   * ============================================================
   * 2. DEVOLUCIÓN DE PUBLICACIONES
   * ============================================================
   */
  it("devuelve correctamente las publicaciones obtenidas", async () => {
    const publications = [
      createPublication(3, 100),
      createPublication(2, 200),
      createPublication(1, 300),
    ];

    const context = createTestContext({
      publications,
    });

    const result = await context.useCase.execute({
      userId: "user-1",
    });

    expect(result).toEqual({
      publications,
    });

    expect(result.publications).toHaveLength(3);

    expect(
      result.publications.map(
        (publication) => publication.documentId,
      ),
    ).toEqual([3, 2, 1]);
  });

  /**
   * ============================================================
   * 3. VARIOS DOCUMENTOS DE UNA MISMA CONVOCATORIA
   * ============================================================
   */
  it("conserva varios documentos oficiales de la misma convocatoria", async () => {
    const publications = [
      createPublication(30, 100),
      createPublication(20, 100),
      createPublication(10, 200),
    ];

    const context = createTestContext({
      publications,
    });

    const result = await context.useCase.execute({
      userId: "user-1",
    });

    expect(result.publications).toHaveLength(3);

    expect(
      result.publications.map(
        (publication) =>
          publication.selectionProcessId,
      ),
    ).toEqual([100, 100, 200]);

    expect(
      result.publications.map(
        (publication) => publication.documentId,
      ),
    ).toEqual([30, 20, 10]);
  });

  /**
   * ============================================================
   * 4. SIN PUBLICACIONES
   * ============================================================
   */
  it("devuelve una lista vacía cuando no hay publicaciones", async () => {
    const context = createTestContext({
      publications: [],
    });

    const result = await context.useCase.execute({
      userId: "user-1",
    });

    expect(result).toEqual({
      publications: [],
    });

    expect(
      context.listLatestOfficialPublications,
    ).toHaveBeenCalledTimes(1);
  });

  /**
   * ============================================================
   * 5. NORMALIZACIÓN DEL IDENTIFICADOR
   * ============================================================
   */
  it("elimina los espacios del identificador del usuario", async () => {
    const context = createTestContext();

    await context.useCase.execute({
      userId: "  user-1  ",
    });

    expect(
      context.listLatestOfficialPublications,
    ).toHaveBeenCalledWith({
      userId: "user-1",
      limit: 5,
    });
  });

  /**
   * ============================================================
   * 6. VALIDACIÓN DE USUARIO VACÍO
   * ============================================================
   */
  it("rechaza un identificador de usuario vacío", async () => {
    const context = createTestContext();

    await expect(
      context.useCase.execute({
        userId: "   ",
      }),
    ).rejects.toThrow(
      "userId is required",
    );

    expect(
      context.listLatestOfficialPublications,
    ).not.toHaveBeenCalled();
  });

  /**
   * ============================================================
   * 7. ERRORES DEL REPOSITORIO
   * ============================================================
   */
  it("propaga los errores cuando falla la consulta", async () => {
    const context = createTestContext();

    context.listLatestOfficialPublications
      .mockRejectedValueOnce(
        new Error(
          "Error consultando publicaciones oficiales",
        ),
      );

    await expect(
      context.useCase.execute({
        userId: "user-1",
      }),
    ).rejects.toThrow(
      "Error consultando publicaciones oficiales",
    );

    expect(
      context.listLatestOfficialPublications,
    ).toHaveBeenCalledTimes(1);
  });
});
