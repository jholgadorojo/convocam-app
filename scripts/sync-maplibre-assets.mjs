/**
 * SPEC-010.6.4.1 - Copia de los recursos de MapLibre para Convoca'm.
 *
 * Ejecucion desde la raiz del proyecto:
 *   node scripts/sync-maplibre-assets.mjs
 *
 * Estos archivos se sirven desde /public/maplibre/ para que MapLibre
 * encuentre tanto su worker como el modulo compartido en Next.js.
 * No modifica ningun archivo fuente ni elimina recursos existentes.
 */

import { readFile, mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const projectRoot = process.cwd();
const sourceDirectory = resolve(projectRoot, "node_modules", "maplibre-gl", "dist");
const destinationDirectory = resolve(projectRoot, "public", "maplibre");
const resourceNames = ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"];

async function readOptionalFile(filePath) {
  try {
    return await readFile(filePath);
  } catch (error) {
    if (error && typeof error === "object" && error.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

async function syncMapLibreAssets() {
  // Leemos ambos archivos antes de escribir ninguno para detectar
  // instalaciones incompletas sin dejar una copia parcialmente actualizada.
  const resources = [];
  for (const name of resourceNames) {
    const sourcePath = join(sourceDirectory, name);
    const contents = await readOptionalFile(sourcePath);
    if (contents === null) {
      throw new Error(
        `No se encuentra ${sourcePath}. Comprueba que MapLibre esta instalado ` +
          "con 'pnpm add maplibre-gl' y ejecuta el script desde la raiz del proyecto.",
      );
    }
    resources.push({ name, contents });
  }

  await mkdir(destinationDirectory, { recursive: true });

  let copied = 0;
  for (const { name, contents } of resources) {
    const destinationPath = join(destinationDirectory, name);
    const previousContents = await readOptionalFile(destinationPath);

    // Evitamos escrituras innecesarias que provocarian recompilaciones en dev.
    if (previousContents?.equals(contents)) {
      console.log(`[MapLibre] Sin cambios: public/maplibre/${name}`);
      continue;
    }

    await writeFile(destinationPath, contents);
    copied += 1;
    console.log(`[MapLibre] Actualizado: public/maplibre/${name}`);
  }

  console.log(
    `[MapLibre] Recursos listos: ${resourceNames.length} comprobados, ${copied} actualizados.`,
  );
}

syncMapLibreAssets().catch((error) => {
  console.error(`[MapLibre] Error: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
