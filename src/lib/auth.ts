import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { ensureUserProfileUseCase } from "@/composition/user-profile";
import {
  FIRST_NAME_TOO_LONG_MESSAGE,
  MAX_FIRST_NAME_LENGTH,
} from "@/modules/user-profile/domain/user-profile";

import { prisma } from "@/shared/infrastructure/database/prisma";
import {
  getPasswordPolicyError,
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
} from "@/shared/infrastructure/security/password-policy";

// Endpoints de better-auth que reciben una contraseña nueva
// y el campo del cuerpo en el que llega.
const PASSWORD_FIELD_BY_PATH: Record<string, string> = {
  "/sign-up/email": "password",
  "/change-password": "newPassword",
  "/reset-password": "newPassword",
};

// Endpoints de better-auth que reciben el nombre del usuario.
const NAME_PATHS = ["/sign-up/email", "/update-user"];

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: MIN_PASSWORD_LENGTH,
    maxPasswordLength: MAX_PASSWORD_LENGTH,
  },

  hooks: {
    // Aplicar la política de contraseñas en el servidor:
    // la comprobación del formulario se puede saltar
    // llamando directamente a /api/auth/sign-up/email.
    before: createAuthMiddleware(async (ctx) => {
      // Limitar la longitud del nombre (registro y cambio de nombre).
      if (
        NAME_PATHS.includes(ctx.path) &&
        typeof ctx.body?.name === "string" &&
        ctx.body.name.trim().length > MAX_FIRST_NAME_LENGTH
      ) {
        throw new APIError("BAD_REQUEST", {
          message: `${FIRST_NAME_TOO_LONG_MESSAGE}.`,
        });
      }

      const passwordField = PASSWORD_FIELD_BY_PATH[ctx.path];

      if (!passwordField) {
        return;
      }

      const passwordError = getPasswordPolicyError(
        ctx.body?.[passwordField],
      );

      if (passwordError) {
        throw new APIError("BAD_REQUEST", {
          message: passwordError,
        });
      }
    }),
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          try {
            await ensureUserProfileUseCase.execute({
              userId: user.id,
              registeredName: user.name,
            });
          } catch (error) {
            // Si falla la inicialización del perfil,
            // no bloqueamos el registro de la cuenta.
            console.error(
              "Error al inicializar UserProfile:",
              error,
            );
          }
        },
      },
    },
  },


  trustedOrigins: ["http://127.0.0.1:3000", "http://192.168.0.173:3000", "http://192.168.3.182:3000"],
});