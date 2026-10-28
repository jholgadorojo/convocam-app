/**
 * Error que lanza save() al crear un seguimiento
 * de una convocatoria que no existe.
 */
export class SelectionProcessNotFoundError extends Error {
  constructor() {
    super("La convocatoria no existe");
    this.name = "SelectionProcessNotFoundError";
  }
}
