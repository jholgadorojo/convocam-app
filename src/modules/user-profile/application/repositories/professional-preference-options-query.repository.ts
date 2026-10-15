
import type {
  ProfessionalPreferenceOptionsDto,
} from "../dto/professional-preference-options.dto";

// ============================================================
// CONSULTA DE OPCIONES PROFESIONALES
// ============================================================

export interface ProfessionalPreferenceOptionsQueryRepository {
  /**
   * Obtiene las materias y los grupos de titulación
   * conocidos por CIDO.
   *
   * No se limita a convocatorias activas.
   */
  listAll(): Promise<ProfessionalPreferenceOptionsDto>;
}
