# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Proyecto

Convoca'm: portal personal para organizar convocatorias de oposiciones (TFM). Next.js 16 (App Router) + React 19, Tailwind 4, shadcn (estilo `base-nova`, primitivas de `@base-ui/react`), better-auth, Prisma 7 sobre PostgreSQL. Gestor de paquetes: **pnpm**. La interfaz, los mensajes de error del dominio y los nombres de los tests están en español.

## Comandos

```bash
docker compose up -d              # PostgreSQL 17 en localhost:5434 (usuario/clave/BD: convocam)
pnpm dev                          # servidor de desarrollo en :3000
pnpm build / pnpm lint
pnpm exec tsc --noEmit            # comprobación de tipos

pnpm test:run                     # tests unitarios (solo src/, sin BD)
pnpm test:integration             # tests de integración (tests/integration, requiere la BD levantada)
pnpm test:all                     # todos
pnpm exec vitest run src/modules/user-profile/domain/user-profile.test.ts   # un archivo
pnpm exec vitest run -t "crea correctamente"                                # por nombre de test

pnpm exec prisma migrate dev --config prisma7.config.ts --name <nombre>
pnpm exec prisma generate --config prisma7.config.ts
pnpm exec prisma studio --config prisma7.config.ts
```

- La config de Prisma está en `prisma7.config.ts` (nombre no estándar) y carga `.env` con `dotenv`. El cliente se genera en `src/generated/prisma` (no editar a mano); hay que regenerarlo tras cambiar `prisma/schema.prisma`.
- Variables en `.env`: `DATABASE_URL`, `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`.
- `vitest.config.mts` define el alias `@` → `./src`. Los tests de integración importan `dotenv/config` para leer `DATABASE_URL`, crean su propio `user` en `beforeEach` y lo borran en `afterEach`.

## Arquitectura

Arquitectura hexagonal por módulos en `src/modules/<módulo>/`. Referencia: `user-profile`.

- `domain/`: entidades con constructor privado. `Entity.create(...)` valida y construye una entidad nueva (sin `id`). `Entity.restore(...)` rehidrata desde persistencia (exige `id`). Sin dependencias de framework ni de Prisma.
- `application/`: casos de uso (clases con `execute(dto)` que devuelven DTOs, no entidades), DTOs y las **interfaces** de repositorio (puertos).
- `adapters/`: implementaciones de los puertos. `Prisma*Repository` para producción e `InMemory*Repository` para los tests unitarios de los casos de uso. Los mappers convierten los registros de Prisma en entidades de dominio vía `restore`.
- `src/composition/<módulo>.ts`: composition root. Instancia repositorios Prisma y exporta los casos de uso ya cableados; la capa de Next.js debe consumirlos desde aquí.
- `src/shared/infrastructure/database/prisma.ts`: singleton de `PrismaClient` con el driver adapter `@prisma/adapter-pg` (obligatorio en Prisma 7), cacheado en `globalThis` fuera de producción.

Dentro de un módulo se importa con rutas relativas; entre capas globales se usa `@/`.

Los tests unitarios se colocan junto al código (`*.test.ts` en `src/`). Los de integración contra PostgreSQL real van en `tests/integration/<módulo>/`.

### Autenticación

- `src/lib/auth.ts`: servidor better-auth con `prismaAdapter` y email+contraseña. Sus tablas (`user`, `session`, `account`, `verification`) están en `schema.prisma`. `UserProfile` (`user_profiles`) es 1:1 con `user` mediante `userId` único y `onDelete: Cascade`.
- `src/app/api/auth/[...all]/route.ts` expone el handler. `src/lib/auth-client.ts` es el cliente React (`authClient.signUp.email`, etc.) usado desde componentes `"use client"` como `src/components/auth/register-form.tsx`.
- Acceso en desarrollo desde orígenes distintos de `localhost:3000` (p. ej. `127.0.0.1` o la IP de la LAN): hay que añadirlos **tanto** en `allowedDevOrigins` de `next.config.ts` (si no, Next.js bloquea el JS de desarrollo y el formulario no llega a hidratarse) **como** en `trustedOrigins` de `src/lib/auth.ts` (si no, better-auth responde `403 Invalid origin`).

### UI

Componentes shadcn en `src/components/ui/`; `cn` se importa del paquete `cn`, re-exportado en `src/lib/utils.ts`. Iconos con `lucide-react`. Fuente Instrument Sans (`next/font`) en `src/app/layout.tsx`.

## Documentación del proyecto

`docs/paso_a_paso.md` recoge el diario/pasos del proyecto y los comandos habituales.
