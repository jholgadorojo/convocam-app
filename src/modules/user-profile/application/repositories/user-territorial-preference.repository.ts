
import type { UserTerritorialPreference } from
    "../../domain/user-territorial-preference";

/**
 * Contrato para gestionar las preferencias territoriales
 * asociadas al perfil de un opositor.
 *
 * Las implementaciones concretas se definirán
 * en la capa de adapters.
 */

export interface UserTerritorialPreferenceRepository {

    // ==========================================================
    // CONSULTAR PREFERENCIAS TERRITORIALES
    // ==========================================================

    /**
     * Obtiene las preferencias territoriales de un perfil.
     *
     * Devuelve null cuando el opositor todavía
     * no ha configurado sus preferencias.
     */
    findByUserProfileId(
        userProfileId: number,
    ): Promise<UserTerritorialPreference | null>;

    // ==========================================================
    // GUARDAR PREFERENCIAS TERRITORIALES
    // ==========================================================

    /**
     * Crea o actualiza las preferencias del perfil.
     *
     * Si no existen, las crea.
     * Si ya existen, sustituye la configuración anterior.
     *
     * La implementación deberá guardar el ámbito y
     * todas las relaciones territoriales de forma atómica.
     */
    save(
        preference: UserTerritorialPreference,
    ): Promise<UserTerritorialPreference>;

    // ==========================================================
    // ELIMINAR PREFERENCIAS TERRITORIALES
    // ==========================================================

    /**
     * Elimina la configuración territorial del perfil.
     *
     * Permite volver al estado "Sin configurar".
     *
     * Devuelve true si existía y se ha eliminado,
     * o false si el perfil no tenía preferencias.
     */
    deleteByUserProfileId(
        userProfileId: number,
    ): Promise<boolean>;
}
