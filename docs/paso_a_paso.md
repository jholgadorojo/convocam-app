# Paso a paso del proyecto

## Comandos utilizables
pnpm test:run               - Ejecutar test unitarios Vitest
pnpm run test:all           - Ejecución de todos los tests
pnpm run test:integration   - Ejecución de test de integración
pnpm exec tsc --noEmit      - Comprobar TypeScript
pnpm lint                   - Comprobar ESLint
pnpm deploy:prod            - Script despliege en produccion

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
pnpm sync:cido; echo "Código de salida: $?"

# Requiere tener configurada la variable CIDO_INTERNAL_API_TOKEN
TOKEN=$(grep '^CIDO_INTERNAL_API_TOKEN=' .env | cut -d= -f2- | tr -d '"')

# y enviar el token en la cabecera Authorization.
curl -sS -X POST http://localhost:3000/api/internal/cido/sync-all \
  -H "Authorization: Bearer $TOKEN" \
  -o sync-resultado.json \
  -w "HTTP %{http_code} en %{time_total} s\n"

## Revisión de pruebas y compilación

### Validación TypeScript
pnpm exec tsc --noEmit

### Validación ESLint
pnpm lint

### Todas las pruebas con cambio de base de datos
pnpm test:all

### Compilación de producción
pnpm build

### Borrar cache navegador
 rm -rf .next/dev

## Despliegue
### Productivo, checkeando comprobaciones de GITHUB Actions, lint, tipos y tests en local
pnpm deploy:prod

### Productivo, saltandome comprobaciones de GITHUB Actions
SKIP_CI=1 pnpm deploy:prod

### Productivo, saltandome lint, tipos, tests en local y GITHUB Actions
SKIP_CI=1 SKIP_CHECKS=1 pnpm deploy:prod

## Productivo
### Muestra si hay funcionado la sincronizacion con CIDO
ssh deploy@151.236.55.203 'tail -n 30 /var/www/convocam/shared/log/sync-cido.log'

### Muestra el log sin errores de nginx
ssh deploy@151.236.55.203 'tail -n 5 /var/log/nginx/access.log'

### Muestra los errores de la APP
ssh deploy@151.236.55.203 'journalctl -u convocam'
journalctl -u convocam --since "2026-10-31 10:15" --until "2026-10-31 10:20"41
