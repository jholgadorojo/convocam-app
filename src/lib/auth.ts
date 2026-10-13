import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { ensureUserProfileUseCase } from "@/composition/user-profile";

import { prisma } from "@/shared/infrastructure/database/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  emailAndPassword: {
    enabled: true,
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


  trustedOrigins: ["http://127.0.0.1:3000", "http://192.168.3.182:3000"],
});