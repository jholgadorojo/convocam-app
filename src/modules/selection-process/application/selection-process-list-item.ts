export type SelectionProcessListItem = {
  /*
   * Identificación
   */
  id: number;
  cidoIdentifier: string;

  /*
   * Información principal
   */
  title: string;
  isJobPool: boolean;

  /*
   * Estado oficial CIDO
   */
  statusId: number;
  status: string;

  /*
   * Plazo de presentación
   *
   * Necesitamos también la fecha inicial
   * para poder calcular:
   *
   * - Próximamente
   * - Plazo abierto
   * - Plazo finalizado
   * - días restantes
   */
  applicationStartDate: Date | null;
  applicationEndDate: Date | null;

  /*
   * Información resumida que mostraremos
   * directamente en la tarjeta.
   */
  numberOfPositions: number | null;
  qualificationGroup: string | null;
  personnelType: string | null;
  selectionSystem: string | null;
  scope: string;

  /*
   * Reservas.
   *
   * Lo agrupamos igual que en el DTO
   * de detalle para que la interfaz sea
   * más sencilla y consistente.
   */
  reservedPlaces: {
    disability: number | null;
    unemployed: boolean;
    youngPeople: boolean;
    women: boolean;
  };

  /*
   * Fuentes
   */
  cidoUrl: string;

  /*
   * Organismo
   */
  institution: {
    name: string;

    municipality: string | null;
    county: string | null;
    province: string | null;
  } | null;
};