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
pnpm test:integration             # tests de integración (tests/integration, requiere la BD convocam_test levantada)
pnpm test:all                     # todos
pnpm exec vitest run src/modules/user-profile/domain/user-profile.test.ts   # un archivo
pnpm exec vitest run -t "crea correctamente"                                # por nombre de test

pnpm exec prisma migrate dev --config prisma7.config.ts --name <nombre>
pnpm exec prisma generate --config prisma7.config.ts
pnpm exec prisma studio --config prisma7.config.ts
pnpm exec tsx prisma/import-idescat-territories.ts   # carga provincias/comarcas/municipios desde prisma/data/idescat-territories.csv
```

- La config de Prisma está en `prisma7.config.ts` (nombre no estándar) y carga `.env` con `dotenv`. El cliente se genera en `src/generated/prisma` (no editar a mano); hay que regenerarlo tras cambiar `prisma/schema.prisma`.
- Variables en `.env`: `DATABASE_URL`, `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, `CIDO_INTERNAL_API_TOKEN` y, opcional, `DEV_ALLOWED_HOSTS`.
- El `postinstall` ejecuta `scripts/sync-maplibre-assets.mjs`, que copia el worker y el módulo compartido de `maplibre-gl` a `public/maplibre/` (los usa el mapa de `user-selection-process/presentation/icgc-municipalities-map.tsx`). Si el mapa falla, volver a ejecutar `pnpm install` o `node scripts/sync-maplibre-assets.mjs`.
- Los tests usan una BD aparte, `convocam_test`, en el mismo PostgreSQL. `.env.test` (no versionado) solo define su `DATABASE_URL`. `vitest.config.mts` carga `.env.test` con prioridad sobre `.env` y pasa esas variables a todos los tests, así que ningún test toca la BD de desarrollo `convocam`. También define el alias `@` → `./src`.
- Prisma CLI (`prisma7.config.ts`) solo lee `.env`. Para migrar `convocam_test` hay que exportar antes sus variables (`set -a; source .env.test; set +a`), ya que `dotenv` no sobrescribe las que ya existen.
- Los tests que usan PostgreSQL van en `tests/integration/<módulo>/` (`user-profile`, `user-selection-process`, `selection-process`, `dashboard`) e importan con `@/`. Crean sus propios datos de prueba y los borran al terminar. La mayoría comprueba al empezar que la BD conectada es `convocam_test`.

## Arquitectura

Arquitectura hexagonal por módulos en `src/modules/<módulo>/`. Referencia: `user-profile`. Módulos: `user-profile` (perfil, residencia, titulaciones, preferencias territoriales y profesionales), `selection-process` (convocatorias CIDO: sincronización, buscador, detalle, «para mí»), `user-selection-process` (seguimiento de convocatorias y estado personal `PersonalSelectionProcessStatus`) y `dashboard` (solo consultas, sin dominio).

La estructura varía entre módulos: `user-profile` agrupa `application/` en `use-cases/`, `dto/` y `repositories/` y usa `adapters/`; los demás usan `infrastructure/prisma/` (y `infrastructure/cido/`) en lugar de `adapters/`, y en `user-selection-process` la interfaz del repositorio vive en `domain/`. Varios módulos tienen `presentation/` con lógica de presentación (etiquetas, clases de badge de estado) e incluso componentes React reutilizables. Al añadir código, imitar la estructura del módulo que se toca.

- `domain/`: entidades con constructor privado. `Entity.create(...)` valida y construye una entidad nueva (sin `id`). `Entity.restore(...)` rehidrata desde persistencia (exige `id`). Sin dependencias de framework ni de Prisma.
- `application/`: casos de uso (clases con `execute(dto)` que devuelven DTOs, no entidades), DTOs y las **interfaces** de repositorio (puertos).
- `adapters/`: implementaciones de los puertos. `Prisma*Repository` para producción e `InMemory*Repository` para los tests unitarios de los casos de uso. Los mappers convierten los registros de Prisma en entidades de dominio vía `restore`.
- `src/composition/<módulo>.ts`: composition root. Instancia repositorios Prisma y exporta los casos de uso ya cableados; la capa de Next.js debe consumirlos desde aquí.
- `src/shared/infrastructure/database/prisma.ts`: singleton de `PrismaClient` con el driver adapter `@prisma/adapter-pg` (obligatorio en Prisma 7), cacheado en `globalThis` fuera de producción.

Dentro de un módulo se importa con rutas relativas; entre capas globales se usa `@/`.

Los tests unitarios se colocan junto al código (`*.test.ts` en `src/`, incluidos los route handlers de `src/app/api/`). Los de integración contra PostgreSQL real van en `tests/integration/<módulo>/`.

### Sincronización con CIDO (`selection-process`)

Importa convocatorias de la API pública CIDO de la Diputació de Barcelona (`https://api.diba.cat/dadesobertes/cido/v1`, formato JSON:API). Este módulo **no sigue la estructura de `user-profile`**: no tiene `domain/` ni entidades, y sus adaptadores están en `infrastructure/` en lugar de `adapters/`.

- `application/`: tipos `*SyncData` (datos planos ya mapeados), puertos `*Source` (lectura de CIDO) y `*Repository` (escritura en BD), y el caso de uso `SyncSelectionProcesses`.
- `infrastructure/cido/`: `cido-client.ts` (funciones `fetch` por endpoint: `/oposicions`, `/oposicions/{id}/institucio`, `/materies`, `/documents`), tipos de respuesta `cido-*-types.ts`, mappers CIDO → `*SyncData` y las implementaciones `Cido*Source`.
- `infrastructure/prisma/`: repositorios basados en `upsert` por `cidoId` (único en cada tabla), que devuelven el `id` numérico interno.
- `SyncSelectionProcesses.execute({ limit, offset })`: para cada convocatoria de la página hace upsert de institución → convocatoria → materias (y reemplaza la tabla puente `SelectionProcessSubjectArea`) → documentos. Las filas sincronizadas llevan campos de seguimiento `sourceActive`, `sourceSyncedAt`, `sourceLastSeenAt`, `sourceHash`; los documentos que desaparecen de CIDO se marcan `sourceActive: false` en vez de borrarse.
- Sincronización completa: `RunSelectionProcessSync` = `SyncAllSelectionProcesses` (recorre todas las páginas, `pageSize` 500, y devuelve `syncStartedAt`) + `ReconcileMissingSelectionProcesses` (las convocatorias activas no vistas desde `syncStartedAt` se reconsultan por `cidoId` en CIDO; si ya no existen se marcan `sourceActive: false`).
- Consultas de lectura (buscador, filtros, «para mí», detalle) en `PrismaSelectionProcessQueryRepository` / `PrismaSelectionProcessDetailRepository`. La búsqueda tolerante usa SQL crudo (`Prisma.sql`) con las extensiones `unaccent` y `pg_trgm` creadas en una migración.
- Endpoint interno `POST /api/internal/cido/sync-all` (sincronización completa + reconciliación), protegido en todos los entornos con `Authorization: Bearer $CIDO_INTERNAL_API_TOKEN` (validado en `src/shared/infrastructure/security/cido-internal-api-token.ts`: entre 32 y 512 caracteres sin espacios, comparación en tiempo constante). Si la variable no está definida o no es válida, responde siempre `401`.

### Dashboard (`dashboard`)

Casos de uso de solo lectura cableados en `src/composition/dashboard.ts`: contadores públicos (reutiliza `listActiveSelectionProcessesUseCase`; estados oficiales CIDO 2 = pendiente de plazo, 3 = plazo abierto), plazos próximos de las convocatorias seguidas (15 días naturales en `Europe/Madrid`, solo estados personales `INTERESTED` y `PREPARING_APPLICATION`) y últimas publicaciones de documentos de las convocatorias seguidas desde el día en que empezó el seguimiento. `PrismaDashboardQueryRepository` filtra por usuario en PostgreSQL (incluye `$queryRaw`).

### Capa Next.js

Páginas en `src/app/` con rutas en español (`convocatorias`, `convocatorias/[id]`, `mis-convocatorias`, `para-mi`, `mi-perfil`, `dashboard`, `login`, `register`). Las mutaciones se hacen con Server Actions (`actions.ts` junto a la página, `"use server"`) que obtienen el usuario con `auth.api.getSession({ headers: await headers() })` —nunca del formulario—, llaman al caso de uso desde `@/composition/...` y hacen `revalidatePath`. El código hace referencia a especificaciones numeradas (`SPEC-004`, `SPEC-006`, `SPEC-009`…) en comentarios.

### Autenticación

- `src/lib/auth.ts`: servidor better-auth con `prismaAdapter` y email+contraseña. Sus tablas (`user`, `session`, `account`, `verification`) están en `schema.prisma`. `UserProfile` (`user_profiles`) es 1:1 con `user` mediante `userId` único y `onDelete: Cascade`.
- `src/app/api/auth/[...all]/route.ts` expone el handler. `src/lib/auth-client.ts` es el cliente React (`authClient.signUp.email`, etc.) usado desde componentes `"use client"` como `src/components/auth/register-form.tsx`.
- Acceso en desarrollo desde orígenes distintos de `localhost:3000` (p. ej. `127.0.0.1` o la IP de la LAN): añadir el host a `DEV_ALLOWED_HOSTS` en `.env` (separados por comas) y reiniciar `pnpm dev`. Lo leen `src/shared/infrastructure/config/dev-allowed-hosts.ts`, `allowedDevOrigins` de `next.config.ts` (si falta, Next.js bloquea el JS de desarrollo y el formulario no llega a hidratarse) y `trustedOrigins` de `src/lib/auth.ts` (si falta, better-auth responde `403 Invalid origin`; en producción no se añade ninguno).

### UI

Componentes shadcn en `src/components/ui/`; `cn` se importa del paquete `cn`, re-exportado en `src/lib/utils.ts`. Iconos con `lucide-react`. Fuente Instrument Sans (`next/font`) en `src/app/layout.tsx`.

## Documentación del proyecto

`docs/paso_a_paso.md` recoge el diario/pasos del proyecto y los comandos habituales.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
