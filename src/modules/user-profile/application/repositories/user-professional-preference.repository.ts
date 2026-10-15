
import type { UserProfessionalPreference } from
  "../../domain/user-professional-preference";

// ============================================================
// CONTRATO DEL REPOSITORIO DE PREFERENCIAS PROFESIONALES
// ============================================================

export interface UserProfessionalPreferenceRepository {

  // ==========================================================
  // CONSULTAR PREFERENCIAS PROFESIONALES
  // ==========================================================

  /**
   * Obtiene las preferencias profesionales de un perfil.
   *
   * Devuelve null si el opositor todavía
   * no ha configurado sus preferencias.
   */
  findByUserProfileId(
    userProfileId: number,
  ): Promise<UserProfessionalPreference | null>;

  // ==========================================================
  // GUARDAR PREFERENCIAS PROFESIONALES
  // ==========================================================

  /**
   * Crea o actualiza las preferencias profesionales.
   *
   * Si no existen, las crea.
   * Si ya existen, sustituye su configuración.
   *
   * Debe conservar el identificador de una
   * configuración previamente guardada.
   *
   * La implementación Prisma deberá guardar
   * todas las relaciones mediante una transacción.
   */
  save(
    preference: UserProfessionalPreference,
  ): Promise<UserProfessionalPreference>;

  // ==========================================================
  // ELIMINAR PREFERENCIAS PROFESIONALES
  // ==========================================================

  /**
   * Elimina las preferencias profesionales del perfil.
   *
   * Devuelve true si se han eliminado.
   * Devuelve false si no existían.
   *
   * Permite regresar al estado "Sin configurar".
   */
  deleteByUserProfileId(
    userProfileId: number,
  ): Promise<boolean>;
}
