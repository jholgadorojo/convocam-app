# Convoca'm

[![CI](https://github.com/jholgadorojo/convocam-app/actions/workflows/ci.yml/badge.svg)](https://github.com/jholgadorojo/convocam-app/actions/workflows/ci.yml)

## Índice

1. [Descripción general del proyecto](#1-descripción-general-del-proyecto)
2. [Stack tecnológico utilizado](#2-stack-tecnológico-utilizado)
3. [Información sobre su instalación y ejecución](#3-información-sobre-su-instalación-y-ejecución)
4. [Estructura del proyecto](#4-estructura-del-proyecto)
5. [Funcionalidades principales](#5-funcionalidades-principales)
6. [Usuario y contraseña de prueba](#6-usuario-y-contraseña-de-prueba)

## 1. Descripción general del proyecto

Convoca'm es un portal personal para organizar convocatorias de oposiciones de Cataluña. Cada año se publican miles de convocatorias de ayuntamientos, consejos comarcales, diputaciones y otros organismos, repartidas en boletines y webs distintas. Seguirlas a mano es difícil: hay que encontrar las que encajan con el perfil de cada persona, no perder ningún plazo y recordar en qué punto está cada proceso.

Convoca'm importa automáticamente las convocatorias publicadas en CIDO, el servicio de datos abiertos de la Diputació de Barcelona, y permite a cada usuario:

- buscarlas con filtros y en un mapa,
- recibir las que encajan con sus preferencias territoriales y profesionales,
- hacer el seguimiento de las que le interesan, con un estado personal, hasta el final del proceso,
- ver en un panel los plazos que vencen pronto y los documentos publicados recientemente.

La aplicación está desplegada en producción en <https://convocam.duckdns.org>.

## 2. Stack tecnológico utilizado

| Ámbito | Tecnología |
| --- | --- |
| Framework | Next.js 16 (App Router, Server Components, Server Actions) y React 19 |
| Lenguaje | TypeScript 5 |
| Interfaz | Tailwind CSS 4, shadcn (primitivas de Base UI), lucide-react, fuente Instrument Sans |
| Mapas | MapLibre GL con cartografía del ICGC |
| Autenticación | better-auth (correo y contraseña) con adaptador de Prisma |
| Base de datos | PostgreSQL 17 con Prisma 7 y driver adapter `@prisma/adapter-pg` |
| Búsqueda | Extensiones `unaccent` y `pg_trgm` de PostgreSQL |
| Validación | zod 4 (respuestas de la API de CIDO) |
| Tests | Vitest 5 (unitarios e integración) |
| Calidad | ESLint 9, comprobación de tipos con `tsc` e integración continua con GitHub Actions |
| Gestor de paquetes | pnpm 11 |
| Producción | Ubuntu 24.04, Node.js 24, systemd, nginx, Let's Encrypt |

## 3. Información sobre su instalación y ejecución

### 3.1 Puesta en marcha en local

Requisitos: Node.js 24, pnpm 11 y Docker.

```bash
pnpm install                  # también copia los recursos de MapLibre a public/
docker compose up -d          # PostgreSQL 17 en localhost:5434
cp .env.example .env          # y completar los valores
pnpm exec prisma migrate dev --config prisma7.config.ts
pnpm exec tsx prisma/import-idescat-territories.ts
pnpm sync:cido                # primera carga de convocatorias (~30 min)
pnpm dev                      # http://localhost:3000
```

Variables de entorno (`.env`, con ejemplo en `.env.example`):

| Variable | Descripción |
| --- | --- |
| `DATABASE_URL` | Conexión a PostgreSQL |
| `BETTER_AUTH_URL` | URL pública de la aplicación |
| `BETTER_AUTH_SECRET` | Secreto de better-auth |
| `CIDO_INTERNAL_API_TOKEN` | Token del endpoint interno de sincronización (32 a 512 caracteres, sin espacios) |
| `DEV_ALLOWED_HOSTS` | Opcional. Hosts adicionales permitidos en desarrollo (por ejemplo, la IP de la red local), separados por comas |

Notas:

- La configuración de Prisma está en `prisma7.config.ts` y el cliente se genera en `src/generated/prisma`. Tras cambiar el esquema: `pnpm exec prisma generate --config prisma7.config.ts`.
- Para entrar desde otro equipo de la red local, añade su host a `DEV_ALLOWED_HOSTS` y reinicia `pnpm dev`.
- Si el mapa no carga, vuelve a ejecutar `pnpm install` (o `node scripts/sync-maplibre-assets.mjs`).

### 3.2 Carga de datos

- **Territorios.** `pnpm exec tsx prisma/import-idescat-territories.ts` carga las provincias, comarcas y municipios de Cataluña desde `prisma/data/idescat-territories.csv` (Idescat).
- **Convocatorias.** `pnpm sync:cido` hace una sincronización completa con CIDO (unas 15.000 convocatorias en unos 30 minutos). Sale con 0 si termina, 1 si falla y 2 si ya hay otra en curso. También se puede lanzar con el endpoint interno `POST /api/internal/cido/sync-all` y la cabecera `Authorization: Bearer $CIDO_INTERNAL_API_TOKEN`, que responde `409` si ya hay una en curso. El funcionamiento se explica en el apartado [5.4](#54-sincronización-con-cido).

### 3.3 Tests e integración continua

```bash
pnpm test:run                                  # unitarios (sin base de datos)
pnpm test:integration                          # integración contra PostgreSQL
pnpm test:all                                  # todos
pnpm exec vitest run -t "crea correctamente"   # por nombre de test
pnpm lint
pnpm exec tsc --noEmit
```

- **Unitarios** (67 archivos), junto al código (`*.test.ts` en `src/`): entidades, casos de uso con repositorios en memoria, mappers y validación de CIDO con respuestas reales guardadas como fixtures, lógica de presentación y route handlers.
- **Integración** (13 archivos), en `tests/integration/<módulo>/`: repositorios Prisma contra PostgreSQL real. Usan una base de datos aparte, `convocam_test`, cuya `DATABASE_URL` está en `.env.test` (no versionado). Cada test crea sus datos y los borra al terminar, y la mayoría comprueba al empezar que está conectada a `convocam_test` y no a la base de datos de desarrollo.

Para preparar la base de datos de tests:

```bash
set -a; source .env.test; set +a
pnpm exec prisma migrate deploy --config prisma7.config.ts
```

**Integración continua.** Cada push a `master` y cada pull request lanzan en GitHub Actions (`.github/workflows/ci.yml`) dos jobs en paralelo, sobre una máquina limpia:

- *Calidad*: instala las dependencias, genera el cliente de Prisma y ejecuta lint, `tsc` y los tests unitarios.
- *Integración*: levanta un PostgreSQL 17 vacío, aplica todas las migraciones y ejecuta los tests de integración.

No necesita secretos. La base de datos se crea y se destruye en cada ejecución.

### 3.4 Despliegue en producción

La aplicación se ejecuta en un VPS Ubuntu 24.04 con Node.js 24, PostgreSQL 17, nginx como proxy inverso y certificado de Let's Encrypt. El despliegue lo hace el script propio `scripts/deploy.sh`, con la misma estructura de carpetas que Capistrano (`releases/`, `shared/` y el enlace `current`).

```bash
pnpm deploy:prod                 # despliega origin/master
pnpm deploy:rollback             # vuelve a la versión anterior
```

`pnpm deploy:prod` comprueba en local lint, tipos y tests; en el servidor extrae el commit en una release nueva, instala dependencias y compila, hace una copia de la base de datos con `pg_dump`, aplica las migraciones, cambia el enlace `current`, reinicia el servicio y comprueba que la aplicación responde. Si algo falla antes de publicar, la versión en marcha no se ve afectada. Además, `pnpm deploy:prod` solo despliega si la CI de GitHub Actions está en verde para ese commit (`SKIP_CI=1` para omitir esta comprobación).

| Componente | Configuración |
| --- | --- |
| Servicio systemd `convocam` | `next start` en `127.0.0.1:3000`, se reinicia si falla |
| nginx | Proxy inverso, HTTPS y redirección de HTTP a HTTPS |
| Let's Encrypt | Certificado con renovación automática de certbot |
| cron | `pnpm sync:cido` a las 6:00, 12:00 y 22:00 |
| logrotate | Rotación semanal del log de sincronización |

Las plantillas de configuración del servidor están en `docs/servidor/`.

## 4. Estructura del proyecto

### 4.1 Carpetas

```text
src/
├── app/                  Páginas, Server Actions y route handlers (rutas en español)
├── components/           Componentes compartidos y componentes shadcn (ui/)
├── composition/          Composition root de cada módulo
├── modules/              Módulos de negocio (Clean Architecture)
├── shared/               Prisma, seguridad, configuración y utilidades de presentación
├── lib/                  Servidor y cliente de better-auth
└── generated/prisma      Cliente de Prisma generado (no se edita)
prisma/                   Esquema, migraciones y datos de territorios (Idescat)
scripts/                  Sincronización con CIDO, despliegue y recursos de MapLibre
tests/integration/        Tests contra PostgreSQL
docs/                     Diario del proyecto y plantillas del servidor
.github/workflows/        Integración continua (GitHub Actions)
```

### 4.2 Arquitectura

El código sigue **Clean Architecture** organizada por módulos. Cada módulo de negocio vive en `src/modules/<módulo>/` y separa el dominio de los detalles técnicos (Next.js, Prisma, la API de CIDO). Las capas se corresponden así con las carpetas:

| Capa | Dónde | Contenido |
| --- | --- | --- |
| Entidades | `domain/` | Entidades y reglas de negocio, sin dependencias de framework ni de Prisma. Las entidades tienen constructor privado: `create(...)` valida y construye una entidad nueva, y `restore(...)` la reconstruye a partir de los datos ya guardados en la base de datos. |
| Casos de uso | `application/` | Casos de uso (clases con `execute(dto)` que devuelven DTOs, nunca entidades), DTOs e interfaces de los repositorios y fuentes de datos que necesitan. |
| Adaptadores de interfaz | `adapters/` o `infrastructure/`, `presentation/` | Implementaciones de esas interfaces: repositorios con Prisma para producción, repositorios en memoria para los tests de los casos de uso y el cliente de la API de CIDO. Lógica de presentación del módulo (etiquetas, estilos de estado) y componentes React reutilizables. |
| Frameworks y drivers | `src/app/`, Prisma, PostgreSQL, better-auth | Páginas, Server Actions y route handlers de Next.js, y los servicios externos. |

**Regla de dependencia.** Las dependencias apuntan siempre hacia dentro: `domain/` no importa nada externo y `application/` solo depende del dominio y de sus propias interfaces. Son los repositorios de las capas externas los que implementan esas interfaces (inversión de dependencias), y el composition root (`src/composition/`), en la capa más externa, es el único sitio donde se conectan las implementaciones concretas con los casos de uso.

| Módulo | Responsabilidad |
| --- | --- |
| `user-profile` | Perfil, residencia, titulaciones y preferencias territoriales y profesionales |
| `selection-process` | Convocatorias de CIDO: sincronización, buscador, filtros, detalle y «Para mí» |
| `user-selection-process` | Seguimiento de convocatorias y estado personal |
| `dashboard` | Consultas de solo lectura para el panel (sin dominio propio) |

Decisiones de diseño:

- **Composition root:** la capa de Next.js nunca instancia repositorios; importa los casos de uso desde `src/composition/`. Así los casos de uso se pueden probar con repositorios en memoria.
- **Server Actions para las mutaciones:** el usuario se obtiene siempre de la sesión en el servidor, nunca del formulario. Después de cada cambio se revalida la ruta afectada.
- **Lógica de presentación fuera de los componentes:** cada página grande tiene un archivo `*-presentation.ts` con funciones puras (parseo de filtros, textos, enlaces) cubiertas por tests, y la página solo compone componentes.

### 4.3 Modelo de datos

El esquema (`prisma/schema.prisma`) tiene 23 modelos, agrupados así:

| Grupo | Tablas |
| --- | --- |
| Autenticación (better-auth) | `user`, `session`, `account`, `verification` |
| Perfil | `user_profiles` (1:1 con `user`), `user_academic_qualifications` |
| Preferencias | `user_territorial_preferences`, `user_preferred_provinces`, `user_preferred_counties`, `user_preferred_municipalities`, `user_professional_preferences`, `user_preferred_subject_areas`, `user_preferred_qualification_groups` |
| Convocatorias (CIDO) | `institutions`, `selection_processes`, `selection_process_documents`, `subject_areas`, `selection_process_subject_areas` |
| Territorio (Idescat) | `provinces`, `counties`, `municipalities` |
| Seguimiento | `user_selection_processes` |
| Sincronización | `selection_process_sync_runs` |

Las tablas que vienen de CIDO guardan su identificador original (`cidoId`, único) y campos de seguimiento de la fuente (`sourceActive`, `sourceSyncedAt`, `sourceLastSeenAt`). Las instituciones guardan latitud y longitud para el mapa y el filtro por distancia. Las migraciones están en `prisma/migrations/`.

## 5. Funcionalidades principales

### 5.1 Funcionalidades

- **Buscador de convocatorias.** Búsqueda de texto tolerante a acentos y errores de escritura, con ordenación por relevancia. Filtros por estado oficial (varios a la vez), territorio (provincia, comarca o municipio), distancia en kilómetros a un municipio, materia, grupo de titulación, plazas o bolsa de trabajo, ámbito, sistema de selección, tipo de personal, plazo de solicitud y plazas reservadas (discapacidad, personas en paro, jóvenes, mujeres). Ordenación por relevancia, fecha de publicación, plazo o municipio, y vista en mapa.
- **Detalle de la convocatoria.** Plazos, plazas, requisitos, sistema de selección, institución convocante con su ubicación y documentos publicados, con navegación de vuelta a la lista de origen.
- **Para mí.** Convocatorias pendientes de plazo o con plazo abierto que encajan con las preferencias territoriales y profesionales del usuario, ordenadas por prioridad de plazo, con mapa de municipios. Excluye las que el usuario ya sigue.
- **Mis convocatorias.** Seguimiento personal con un estado propio para cada convocatoria, fecha de inicio del seguimiento y del último cambio de estado, filtros por estado y plazo, contadores y mapa con la localización de las convocatorias seguidas.
- **Dashboard.** Para visitantes, contadores públicos de convocatorias activas. Para usuarios, además: recuento por estado personal (con acceso directo al listado filtrado), plazos que vencen en los próximos 15 días, últimas publicaciones de documentos de las convocatorias seguidas, convocatorias caducadas y nuevas oportunidades de «Para mí».
- **Mi perfil.** Residencia, titulaciones académicas, preferencias territoriales (toda Cataluña o provincias, comarcas y municipios concretos) y profesionales (plazas, bolsas o ambas; materias; grupos de titulación).
- **Cuentas de usuario** con correo electrónico y contraseña.

Estados personales de seguimiento: me interesa, preparando solicitud, solicitud presentada, admitido, excluido, pendiente de examen, examen realizado y finalizado.

### 5.2 Rutas de la aplicación

| Ruta | Contenido | Acceso |
| --- | --- | --- |
| `/` | Portada | Público |
| `/convocatorias` | Buscador con filtros y mapa | Público |
| `/convocatorias/[id]` | Detalle de una convocatoria | Público |
| `/dashboard` | Panel general o personal | Público / usuario |
| `/para-mi` | Convocatorias según el perfil | Usuario |
| `/mis-convocatorias` | Seguimiento personal | Usuario |
| `/mi-perfil` | Perfil y preferencias | Usuario |
| `/login`, `/register` | Acceso y registro | Público |
| `/api/auth/[...all]` | API de better-auth | Interna |
| `/api/internal/cido/sync-all` | Sincronización completa con CIDO | Token |

### 5.3 Búsqueda y «Para mí»

**Búsqueda tolerante.** Cada término escrito debe aparecer, o parecerse lo bastante (`word_similarity` de `pg_trgm` de al menos 0,55), en el título, el organismo, su municipio, comarca o provincia, o el grupo de titulación. Las comparaciones ignoran mayúsculas y tildes (`unaccent`). La relevancia pondera las coincidencias: el título pesa más que el organismo, y este más que la ubicación.

**Filtro por distancia.** Selecciona las instituciones situadas a un radio dado (en línea recta, fórmula del haversine) del municipio elegido.

**«Para mí».** Combina las preferencias del usuario en un filtro de búsqueda:

- Solo convocatorias pendientes de plazo o con plazo abierto (estados oficiales 2 y 3 de CIDO).
- Preferencias territoriales: toda Cataluña, o solo las provincias, comarcas y municipios elegidos.
- Preferencias profesionales: plazas, bolsas o ambas; materias; grupos de titulación.
- Si el usuario no ha configurado ninguna preferencia, la página le invita a completar su perfil.

### 5.4 Sincronización con CIDO

La aplicación importa los datos de la API pública de CIDO (`https://api.diba.cat/dadesobertes/cido/v1`, formato JSON:API): convocatorias, instituciones, materias y documentos.

1. **Sincronización completa.** Recorre todas las páginas de la API (500 convocatorias por página). Para cada convocatoria hace upsert de la institución, la convocatoria, sus materias y sus documentos. Las respuestas se validan con zod; las que no cumplen el esquema se anotan como rechazadas.
2. **Reconciliación.** Las convocatorias activas que no han aparecido en esta sincronización se vuelven a consultar una a una. Si ya no existen en CIDO, se marcan como inactivas.
3. **Nada se borra.** Convocatorias y documentos desaparecidos se marcan con `sourceActive: false`.

Robustez:

- Si falla una convocatoria, se anota en `failures` y se sigue con las demás. Solo se aborta si falla la lectura de una página entera.
- Cada ejecución queda registrada en `selection_process_sync_runs` con su estado (`RUNNING`, `COMPLETED`, `FAILED`) y su resultado.
- Una columna única hace de bloqueo e impide dos sincronizaciones a la vez. Una ejecución que lleve más de 2 horas en marcha se da por interrumpida.

En producción se ejecuta tres veces al día con cron (apartado [3.4](#34-despliegue-en-producción)).

### 5.5 Seguridad

- Contraseñas de 8 a 128 caracteres, con al menos una letra y un número, validadas también en el servidor.
- Las Server Actions obtienen el usuario de la sesión; las consultas personales filtran siempre por ese usuario.
- Las redirecciones tras el inicio de sesión solo aceptan rutas internas de la aplicación.
- El endpoint de sincronización exige un token de 32 a 512 caracteres, comparado en tiempo constante. Si el token no está configurado, responde siempre `401`.
- En producción, PostgreSQL solo escucha en la máquina local, la aplicación solo en `127.0.0.1` detrás de nginx con HTTPS, y el cortafuegos solo abre SSH, HTTP y HTTPS.

### 5.6 Mejoras futuras

**Análisis de bases con IA**

Un objetivo a largo plazo es extraer mediante IA la información de las bases de cada convocatoria. El problema es que las bases las redacta cada administración convocante sin una plantilla común, y cada una las estructura a su manera. Para mí, una de las mejoras más importantes será interpretar con IA cualquier PDF de bases y volcar sus datos clave a la plataforma, para que sean más fáciles de leer y comprender.

**Convocatorias de todo el Estado**

Otra mejora prevista es recoger convocatorias de toda España, no solo las que publica CIDO en Cataluña. La Clean Architecture lo facilita: la sincronización depende de interfaces como `SelectionProcessSource` o `InstitutionSource` y no de CIDO directamente. Añadir una nueva fuente consistiría sobre todo en escribir su cliente y sus mappers en `infrastructure/`, y el caso de uso de sincronización, el buscador, «Para mí» y el seguimiento se reutilizarían sin cambios. Habría que adaptar el identificador de origen, que hoy es `cidoId`, para distinguir de qué fuente viene cada convocatoria, y cargar los territorios del resto de comunidades, porque ahora solo están los de Cataluña (Idescat).

**Colaboración con academias de oposiciones**

También está prevista la colaboración con academias de oposiciones. La idea es mostrar en cada convocatoria enlaces a academias, temarios o cursos relacionados con la plaza. Al opositor le aporta recursos para prepararse, y a Convoca'm le sirve para darse a conocer y captar más usuarios a través de las academias.

### 5.7 Limitaciones conocidas

**Idioma**

La interfaz está en castellano, mientras que el contenido de las convocatorias llega de CIDO en catalán. Para el TFM se ha mantenido así, pero para que Convoca'm sea un producto viable debería ser multiidioma, al menos en catalán y castellano.

**Gestión de cuentas**

La gestión de cuentas cubre lo básico: registro, inicio y cierre de sesión. Para un producto más robusto faltaría:

- recuperar la contraseña por correo electrónico, ya que la aplicación todavía no envía correos;
- verificar el correo al registrarse;
- cambiar la contraseña desde «Mi perfil»;
- que el usuario pueda borrar su cuenta y sus datos.

## 6. Usuario y contraseña de prueba

La aplicación en producción tiene un usuario de prueba con el perfil configurado y algunas convocatorias en seguimiento:

| Dato | Valor |
| --- | --- |
| URL | <https://convocam.duckdns.org/login> |
| Usuario | `mouredev@example.com` |
| Contraseña | `BigSchool2026` |

Con este usuario se puede probar todo lo que requiere sesión: el dashboard personal, «Para mí», «Mis convocatorias» (cambiar el estado de seguimiento, seguir y dejar de seguir convocatorias) y «Mi perfil». El buscador y el detalle de las convocatorias son públicos y no necesitan iniciar sesión.

También se puede crear una cuenta nueva desde <https://convocam.duckdns.org/register>.
