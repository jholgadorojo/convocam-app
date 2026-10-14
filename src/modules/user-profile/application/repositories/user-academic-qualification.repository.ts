
import { UserAcademicQualification } from
    "../../domain/user-academic-qualification";

/**
 * Contrato para gestionar las titulaciones académicas
 * asociadas al perfil de un opositor.
 *
 * Las implementaciones concretas se definirán
 * en la capa de infraestructura/adapters.
 */
export interface UserAcademicQualificationRepository {

    /**
     * Obtener todas las titulaciones de un perfil.
     */
    listByUserProfileId(
        userProfileId: number,
    ): Promise<UserAcademicQualification[]>;

    /**
     * Obtener una titulación concreta,
     * comprobando que pertenece al perfil indicado.
     */
    findByIdAndUserProfileId(
        id: number,
        userProfileId: number,
    ): Promise<UserAcademicQualification | null>;

    /**
     * Guardar una titulación.
     *
     * Sin id: crear.
     * Con id: actualizar.
     */
    save(
        qualification: UserAcademicQualification,
    ): Promise<UserAcademicQualification>;

    /**
     * Eliminar una titulación perteneciente
     * al perfil indicado.
     *
     * Devuelve true si se ha eliminado.
     * Devuelve false si no existe en ese perfil.
     */
    deleteByIdAndUserProfileId(
        id: number,
        userProfileId: number,
    ): Promise<boolean>;
}
