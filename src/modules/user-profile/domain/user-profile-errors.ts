/**
 * Errores del módulo de perfil que la capa de Next.js
 * distingue con instanceof en lugar de comparar mensajes.
 */

/**
 * Datos no válidos. Su mensaje se puede mostrar
 * tal cual al usuario.
 */
export class UserProfileValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserProfileValidationError";
  }
}

/**
 * El usuario todavía no tiene un perfil creado.
 */
export class UserProfileNotFoundError extends Error {
  constructor(message = "El usuario no tiene un perfil") {
    super(message);
    this.name = "UserProfileNotFoundError";
  }
}

/**
 * La titulación académica no existe o no pertenece
 * al perfil del usuario.
 */
export class AcademicQualificationNotFoundError extends Error {
  constructor() {
    super("La titulación académica no existe");
    this.name = "AcademicQualificationNotFoundError";
  }
}
