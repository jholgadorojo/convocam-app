import "dotenv/config";

import { runSelectionProcessSyncUseCase } from "@/composition/selection-process";
import { prisma } from "@/shared/infrastructure/database/prisma";

/**
 * Sincronización completa de convocatorias CIDO desde la línea
 * de comandos, sin pasar por el servidor web. Usa el mismo caso
 * de uso y el mismo bloqueo que POST /api/internal/cido/sync-all.
 *
 * Códigos de salida: 0 completada, 1 error, 2 ya había otra en curso.
 */
const EXIT_ALREADY_RUNNING = 2;

async function main(): Promise<number> {
  console.log(
    `[${new Date().toISOString()}] Inicio de la sincronización de CIDO`,
  );

  const result =
    await runSelectionProcessSyncUseCase.execute();

  if (!result.completed) {
    console.warn(
      "Ya hay una sincronización de CIDO en curso. No se ha iniciado otra.",
    );

    return EXIT_ALREADY_RUNNING;
  }

  const { sync, reconciliation } = result;

  console.log(
    `[${new Date().toISOString()}] Sincronización finalizada (ejecución ${result.syncRunId})`,
  );

  console.log(
    `Convocatorias: ${sync.processed} de ${sync.totalAvailable} en ${sync.pagesProcessed} páginas, ${sync.failed} con error`,
  );

  console.log(
    `Reconciliación: ${reconciliation.checked} revisadas, ${reconciliation.updated} actualizadas, ${reconciliation.deactivated} desactivadas, ${reconciliation.failed} con error`,
  );

  for (const failure of sync.failures) {
    console.warn(
      `  Error en la convocatoria ${failure.cidoId}: ${failure.message}`,
    );
  }

  for (const failure of reconciliation.failures) {
    console.warn(
      `  Error al reconciliar la convocatoria ${failure.cidoId}: ${failure.message}`,
    );
  }

  return 0;
}

// process.exitCode en vez de process.exit() para que
// $disconnect llegue a cerrar la conexión.
main()
  .then((exitCode) => {
    process.exitCode = exitCode;
  })
  .catch((error: unknown) => {
    console.error(
      "Error en la sincronización de CIDO:",
      error,
    );

    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
