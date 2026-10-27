
/**
 * Política de contraseñas de Convoca'm.
 *
 * La usan tanto el formulario de registro (para avisar
 * al usuario) como el servidor de better-auth (que es
 * quien realmente la hace cumplir: la validación del
 * cliente se puede saltar llamando directamente a la API).
 *
 * Sin dependencias: puede importarse desde componentes
 * "use client" y desde código de servidor.
 */

export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;

/**
 * Devuelve el mensaje de error público si la contraseña
 * no cumple la política, o null si es válida.
 */
export function getPasswordPolicyError(
  password: unknown,
): string | null {
  if (typeof password !== "string") {
    return "La contraseña no es válida.";
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    return `La contraseña no puede superar los ${MAX_PASSWORD_LENGTH} caracteres.`;
  }

  if (
    password.length < MIN_PASSWORD_LENGTH ||
    !/[A-Za-z]/.test(password) ||
    !/\d/.test(password)
  ) {
    return `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres, una letra y un número.`;
  }

  return null;
}
