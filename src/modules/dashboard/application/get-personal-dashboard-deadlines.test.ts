
import { describe, expect, it, vi } from "vitest";

import { PersonalSelectionProcessStatus } from
  "@/modules/user-selection-process/domain/personal-selection-process-status";

import type {
  DashboardQueryRepository,
  DashboardUpcomingDeadlineItem,
  DashboardUpcomingDeadlinesQuery,
} from "./dashboard-query-repository";

import { GetPersonalDashboardDeadlines } from
  "./get-personal-dashboard-deadlines";

/**
 * SPEC-009 — Dashboard del opositor.
 *
 * Pruebas unitarias del caso de uso
 * GetPersonalDashboardDeadlines.
 *
 * No necesitan una conexión a PostgreSQL.
 */

/**
 * Representa una fecha de calendario
 * utilizando medianoche UTC.
 *
 * Ejemplo:
 * "2026-10-18" -> 2026-10-18T00:00:00.000Z
 */
function dateOnly(value: string): Date {
  return new Date(
    `${value}T00:00:00.000Z`,
  );
}

/**
 * Crea una convocatoria de prueba
 * con una fecha de finalización.
 */
function createDeadline(
  id: number,
  endDate: string,
  personalStatus:
    PersonalSelectionProcessStatus =
    PersonalSelectionProcessStatus.INTERESTED,
): DashboardUpcomingDeadlineItem {
  return {
    selectionProcessId: id,
    title: `Convocatoria de prueba ${id}`,
    municipality: "Municipio de prueba",
    applicationEndDate: dateOnly(endDate),
    personalStatus,
  };
}

/**
 * Configuración de los datos simulados.
 */
type TestOptions = {
  now?: Date;
  followedCount?: number;
  upcomingCount?: number;
  items?: DashboardUpcomingDeadlineItem[];
};

/**
 * Crea un repositorio simulado
 * y el caso de uso que vamos a comprobar.
 *
 * Inyectamos el reloj para que los resultados
 * no dependan del día en que se ejecuten
 * las pruebas.
 */
function createTestContext(
  options: TestOptions = {},
) {
  const now =
    options.now ??
    new Date("2026-10-18T12:00:00.000Z");

  const countFollowedByUser = vi.fn(
    async (
      _userId: string,
    ): Promise<number> => {
      return options.followedCount ?? 12;
    },
  );

  const countUpcomingDeadlines = vi.fn(
    async (
      _query: DashboardUpcomingDeadlinesQuery,
    ): Promise<number> => {
      return options.upcomingCount ?? 8;
    },
  );

  const listUpcomingDeadlines = vi.fn(
    async (
      _query: DashboardUpcomingDeadlinesQuery & {
        limit: number;
      },
    ): Promise<DashboardUpcomingDeadlineItem[]> => {
      return options.items ?? [];
    },
  );

  const repository: DashboardQueryRepository = {
    countFollowedByUser,
    countUpcomingDeadlines,
    listUpcomingDeadlines,

    // Método incorporado en SPEC-009, paso 6.3.10.
    // Estas pruebas no lo utilizan.
    listLatestOfficialPublications: vi.fn(
      async () => [],
    ),
  };

  const useCase =
    new GetPersonalDashboardDeadlines(
      repository,
      () => now,
    );

  return {
    useCase,
    countFollowedByUser,
    countUpcomingDeadlines,
    listUpcomingDeadlines,
  };
}

describe("GetPersonalDashboardDeadlines", () => {
  /**
   * ========================================================
   * CONTADORES PERSONALES
   * ========================================================
   */

  it("devuelve el total de seguimientos y de plazos próximos", async () => {
    const context = createTestContext({
      followedCount: 24,
      upcomingCount: 7,
    });

    const result = await context.useCase.execute({
      userId: "user-1",
    });

    expect(result.followedCount).toBe(24);

    expect(result.upcomingDeadlinesCount).toBe(7);

    expect(result.upcomingDeadlines).toEqual([]);

    expect(
      context.countFollowedByUser,
    ).toHaveBeenCalledWith("user-1");

    expect(
      context.countUpcomingDeadlines,
    ).toHaveBeenCalledTimes(1);

    expect(
      context.listUpcomingDeadlines,
    ).toHaveBeenCalledTimes(1);
  });

  /**
   * ========================================================
   * INTERVALO DE 15 DÍAS
   * ========================================================
   */

  it("consulta desde hoy hasta 15 días después, ambos incluidos", async () => {
    const context = createTestContext({
      now: new Date(
        "2026-10-18T12:00:00.000Z",
      ),
    });

    await context.useCase.execute({
      userId: "user-1",
    });

    const expectedQuery = {
      userId: "user-1",
      fromDate: dateOnly("2026-10-18"),
      toDate: dateOnly("2026-11-02"),
      personalStatuses: [
        PersonalSelectionProcessStatus.INTERESTED,
        PersonalSelectionProcessStatus.PREPARING_APPLICATION,
      ],
    };

    expect(
      context.countUpcomingDeadlines,
    ).toHaveBeenCalledWith(expectedQuery);

    expect(
      context.listUpcomingDeadlines,
    ).toHaveBeenCalledWith({
      ...expectedQuery,
      limit: 5,
    });
  });

  /**
   * ========================================================
   * ESTADOS PERSONALES PERMITIDOS
   * ========================================================
   */

  it("solo solicita los estados Me interesa y Preparando solicitud", async () => {
    const context = createTestContext();

    await context.useCase.execute({
      userId: "user-1",
    });

    const query =
      context.countUpcomingDeadlines.mock
        .calls[0]?.[0];

    expect(query).toBeDefined();

    expect(query?.personalStatuses).toEqual([
      PersonalSelectionProcessStatus.INTERESTED,
      PersonalSelectionProcessStatus.PREPARING_APPLICATION,
    ]);

    expect(query?.personalStatuses).not.toContain(
      PersonalSelectionProcessStatus.APPLICATION_SUBMITTED,
    );

    expect(query?.personalStatuses).not.toContain(
      PersonalSelectionProcessStatus.COMPLETED,
    );
  });

  /**
   * ========================================================
   * LÍMITE DEL LISTADO
   * ========================================================
   */

  it("solicita como máximo cinco convocatorias para el listado", async () => {
    const context = createTestContext({
      followedCount: 30,
      upcomingCount: 12,
    });

    const result = await context.useCase.execute({
      userId: "user-1",
    });

    expect(result.followedCount).toBe(30);

    expect(result.upcomingDeadlinesCount).toBe(12);

    expect(
      context.listUpcomingDeadlines,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 5,
      }),
    );
  });

  /**
   * ========================================================
   * DÍAS RESTANTES
   * ========================================================
   */

  it("calcula correctamente los días restantes, incluyendo hoy y el día 15", async () => {
    const items = [
      createDeadline(101, "2026-10-18"),
      createDeadline(102, "2026-10-19"),
      createDeadline(103, "2026-10-21"),
      createDeadline(104, "2026-11-02"),
    ];

    const context = createTestContext({
      now: new Date(
        "2026-10-18T12:00:00.000Z",
      ),
      followedCount: 10,
      upcomingCount: 4,
      items,
    });

    const result = await context.useCase.execute({
      userId: "user-1",
    });

    expect(
      result.upcomingDeadlines.map(
        (item) => ({
          id: item.selectionProcessId,
          daysRemaining: item.daysRemaining,
        }),
      ),
    ).toEqual([
      {
        id: 101,
        daysRemaining: 0,
      },
      {
        id: 102,
        daysRemaining: 1,
      },
      {
        id: 103,
        daysRemaining: 3,
      },
      {
        id: 104,
        daysRemaining: 15,
      },
    ]);

    expect(result.upcomingDeadlines).toEqual(
      items.map((item, index) => ({
        ...item,
        daysRemaining: [0, 1, 3, 15][index],
      })),
    );
  });

  /**
   * ========================================================
   * FECHA LOCAL DE CATALUNYA
   * ========================================================
   */

  it("utiliza el día de Catalunya aunque en UTC todavía sea el día anterior", async () => {
    /**
     * En Catalunya:
     *
     * 18/10/2026 a las 22:30 UTC
     * equivale a
     * 19/10/2026 a las 00:30.
     */
    const context = createTestContext({
      now: new Date(
        "2026-10-18T22:30:00.000Z",
      ),
    });

    await context.useCase.execute({
      userId: "user-1",
    });

    expect(
      context.countUpcomingDeadlines,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        fromDate: dateOnly("2026-10-19"),
        toDate: dateOnly("2026-11-03"),
      }),
    );
  });

  /**
   * ========================================================
   * CAMBIOS DE HORARIO
   * ========================================================
   */

  it.each([
    {
      description: "inicio del horario de verano",
      now: "2026-03-29T00:30:00.000Z",
      fromDate: "2026-03-29",
      toDate: "2026-04-13",
    },
    {
      description: "fin del horario de verano",
      now: "2026-10-25T00:30:00.000Z",
      fromDate: "2026-10-25",
      toDate: "2026-11-09",
    },
  ])(
    "mantiene 15 días naturales durante el $description",
    async ({
      now,
      fromDate,
      toDate,
    }) => {
      const context = createTestContext({
        now: new Date(now),
      });

      await context.useCase.execute({
        userId: "user-1",
      });

      expect(
        context.countUpcomingDeadlines,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          fromDate: dateOnly(fromDate),
          toDate: dateOnly(toDate),
        }),
      );
    },
  );

  /**
   * ========================================================
   * SIN PLAZOS PRÓXIMOS
   * ========================================================
   */

  it("devuelve una lista vacía si no hay plazos próximos", async () => {
    const context = createTestContext({
      followedCount: 6,
      upcomingCount: 0,
      items: [],
    });

    const result = await context.useCase.execute({
      userId: "user-1",
    });

    expect(result).toEqual({
      followedCount: 6,
      upcomingDeadlinesCount: 0,
      upcomingDeadlines: [],
    });

    expect(
      context.listUpcomingDeadlines,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 5,
      }),
    );
  });

  /**
   * ========================================================
   * NORMALIZACIÓN DEL USUARIO
   * ========================================================
   */

  it("elimina los espacios del identificador del usuario", async () => {
    const context = createTestContext();

    await context.useCase.execute({
      userId: "  user-1  ",
    });

    expect(
      context.countFollowedByUser,
    ).toHaveBeenCalledWith("user-1");

    expect(
      context.countUpcomingDeadlines,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
      }),
    );

    expect(
      context.listUpcomingDeadlines,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
      }),
    );
  });

  /**
   * ========================================================
   * VALIDACIÓN
   * ========================================================
   */

  it("rechaza un identificador de usuario vacío", async () => {
    const context = createTestContext();

    await expect(
      context.useCase.execute({
        userId: "   ",
      }),
    ).rejects.toThrow("userId is required");

    expect(
      context.countFollowedByUser,
    ).not.toHaveBeenCalled();

    expect(
      context.countUpcomingDeadlines,
    ).not.toHaveBeenCalled();

    expect(
      context.listUpcomingDeadlines,
    ).not.toHaveBeenCalled();
  });

  /**
   * ========================================================
   * ERRORES DEL REPOSITORIO
   * ========================================================
   */

  it("propaga los errores cuando falla una consulta", async () => {
    const context = createTestContext();

    context.countUpcomingDeadlines
      .mockRejectedValueOnce(
        new Error("Error consultando PostgreSQL"),
      );

    await expect(
      context.useCase.execute({
        userId: "user-1",
      }),
    ).rejects.toThrow(
      "Error consultando PostgreSQL",
    );
  });
});
