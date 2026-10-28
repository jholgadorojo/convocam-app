# Paso a paso del proyecto

## Comandos utilizables
pnpm test:run               - Ejecutar test unitarios Vitest
pnpm run test:all           - Ejecución de todos los tests
pnpm run test:integration   - Ejecución de test de integración
pnpm exec tsc --noEmit      - Comprobar TypeScript
pnpm lint                   - Comprobar ESLint

## Prisma migraciones

### Validar el model escrito en schema.prisma si es correcto, pero todavía sin migration
pnpm exec prisma format     - Validación de Prisma al añadir un modelo de datos
pnpm exec prisma validate   - Validación de Prisma al añadir un modelo de datos

### Generar la migración sin ejecutarla
pnpm exec prisma migrate dev --name add_cido_models --create-only

Genera una migración en la carpeta prisma donde informa cómo quedarán las tablas y campos en la base de datos.
Nota: si se quieren hacer cambios, se debería eliminar la carpeta, cambiar el fichero schema.prisma y volver a generar los comandos.

### Aplicar la migración a PostgreSQL
pnpm exec prisma migrate dev

### Generar de nuevo el cliente Prisma
pnpm exec prisma generate
Nota: esto actualiza el cliente de Prisma para que desde TypeScript podamos utilizarlo.

### Comprobar el estado de las migraciones
pnpm exec prisma migrate status

### Comprobación visual de las tablas
pnpm exec prisma studio     - Ver la base de datos

## PostgreSQL

### Para entrar en la base de datos en terminal
docker exec -it convocam-postgres psql -U convocam -d convocam

### Base de datos seleccionada
SELECT current_database();

### Comando visualizar las tablas
\dt

### Salir
\q

### Base de datos seleccionada
echo "${DATABASE_URL##*/}"

### Quitar base de datos de test
unset DATABASE_URL

## Convoca'm

### Sincronizar datos con CIDO DIBA
# Requiere tener configurada la variable CIDO_INTERNAL_API_TOKEN
# y enviar el token en la cabecera Authorization.
curl -X POST http://localhost:3000/api/internal/cido/sync-all \
  -H "Authorization: Bearer $CIDO_INTERNAL_API_TOKEN"

## Revisión de pruebas y compilación

### Validación TypeScript
pnpm exec tsc --noEmit

### Validación ESLint
pnpm lint

### Pruebas unitarias con Vitest
pnpm test:run

### Pruebas de integración
set -a
source .env.test
set +a
pnpm test:integration

### Todas las pruebas con cambio de base de datos
pnpm test:all

### Compilación de producción
pnpm build

### Borrar cache navegador
 rm -rf .next/dev