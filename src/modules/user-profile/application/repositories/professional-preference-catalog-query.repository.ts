
export interface ProfessionalPreferenceCatalogQueryRepository {
  /**
   * Comprueba que todas las materias seleccionadas
   * están disponibles en el catálogo CIDO.
   *
   * Un array vacío se considera válido.
   */
  allSubjectAreasExist(
    subjectAreaIds: number[],
  ): Promise<boolean>;

  /**
   * Comprueba que todos los grupos de titulación
   * seleccionados están disponibles en CIDO.
   *
   * Un array vacío se considera válido.
   */
  allQualificationGroupsExist(
    qualificationGroups: string[],
  ): Promise<boolean>;
}
