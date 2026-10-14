
import type { TerritorialSelection } from "../../domain/user-territorial-preference";

// ============================================================
// CONSULTA DEL CATÁLOGO TERRITORIAL
// ============================================================

export interface TerritorialCatalogQueryRepository {
  /**
   * Comprueba que todas las provincias, comarcas
   * y municipios indicados existen en el catálogo.
   *
   * Devuelve true si todos existen.
   * Devuelve false si alguno no existe.
   */
  allTerritoriesExist(
    selection: TerritorialSelection,
  ): Promise<boolean>;
}
