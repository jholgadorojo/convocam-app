# Paso a paso del proyecto

## Comandos utilizables
pnpm test:run               - Ejecutar test unitarios Vitest
pnpm run test:all           - Ejecucion de todos los tests
pnpm run test:integration   - Ejecucion de test de integracion
pnpm exec tsc --noEmit      - Comprobar Typescript

## Prisma migraciones

### Validar el model escrito es schema.prisma si es correcto, pero todavia sin migration
pnpm exec prisma format     - Validacion de Prisma al añadir un modelo de datos
pnpm exec prisma validate   - Validacion de Prisma al añadir un modelo de datos   

### Generar la migración sin ejecutarla
pnpm exec prisma migrate dev --name add_cido_models --create-only

Genera una migracion en la carpeta prisma donde informa como quedaran los tablas y campos en la base de datos.
Nota: Si se quiere hacer cambios, se deberia eliminar la carpeta, cambiar el fichero schema.prisma, y volver a generar los comandos

### Aplicar la migración a PostgreSQL
pnpm exec prisma migrate dev

### Generar de nuevo el cliente Prisma
pnpm exec prisma generate
Nota: Esto actualiza el cliente de Prisma para que desde TypeScript podamos utilizar

### Comprobar el estado de las migraciones
pnpm exec prisma migrate status

### Comprobación visual de las tablas
pnpm exec prisma studio     - Ver la base de datos