# SPEC-004 — Buscador de convocatorias

## Estado
**Completada**

## Objetivo
Construir el buscador real de convocatorias de Convoca'm utilizando los datos sincronizados desde CIDO y almacenados en PostgreSQL.

Debe permitir consultar convocatorias sin autenticación, combinar múltiples filtros, realizar búsquedas tolerantes a acentos y pequeñas variaciones de escritura, ordenar resultados por relevancia cuando existe texto de búsqueda y mantener paginación y filtros durante la navegación.

## Alcance
Incluye:
- listado real desde PostgreSQL;
- búsqueda libre;
- filtros combinables;
- filtros territoriales dependientes;
- búsqueda tolerante;
- ranking por relevancia;
- paginación;
- conservación de filtros;
- opciones de filtro obtenidas desde base de datos;
- tests unitarios;
- tests de integración contra PostgreSQL.

Queda fuera:
- detalle individual de convocatoria;
- favoritos;
- análisis inteligente de documentos;
- clasificación por tipo de administración;
- mapa territorial interactivo.

# 1. Arquitectura

```text
/convocatorias
      ↓
Next.js page.tsx
      ↓
ListActiveSelectionProcesses
      ↓
SelectionProcessQueryRepository
      ↓
PrismaSelectionProcessQueryRepository
      ↓
PostgreSQL
```

La capa Application desconoce Prisma, PostgreSQL, `unaccent` y `pg_trgm`.

# 2. Archivos principales

## Application

```text
src/modules/selection-process/application/
```

### `selection-process-list-item.ts`
Define el formato necesario para mostrar una convocatoria:
- `id`
- `cidoIdentifier`
- `title`
- `isJobPool`
- `applicationEndDate`
- `qualificationGroup`
- `status`
- `cidoUrl`
- `institution.name`
- `institution.municipality`
- `institution.county`
- `institution.province`

### `selection-process-page.ts`

```ts
export type SelectionProcessPage = {
  items: SelectionProcessListItem[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};
```

### `selection-process-search-filters.ts`

```ts
export type SelectionProcessSearchFilters = {
  text?: string;
  municipality?: string;
  county?: string;
  province?: string;
  statusId?: number;
  scopeId?: number;
  selectionSystemId?: number;
  personnelTypeId?: number;
  qualificationGroup?: string | string[];
  isJobPool?: boolean;
  applicationEndDateFrom?: Date;
  applicationEndDateTo?: Date;
  reservedDisability?: boolean;
  reservedUnemployed?: boolean;
  reservedYoung?: boolean;
  reservedWomen?: boolean;
};
```

### `selection-process-query-repository.ts`

```ts
export interface SelectionProcessQueryRepository {
  findActive(
    page: number,
    pageSize: number,
    filters: SelectionProcessSearchFilters,
  ): Promise<SelectionProcessPage>;

  getFilterOptions(): Promise<SelectionProcessFilterOptions>;
}
```

### `list-active-selection-processes.ts`
Responsable de:
- valores por defecto;
- validación de `page`;
- validación de `pageSize`;
- delegar la consulta al repositorio.

Valores por defecto:

```text
page = 1
pageSize = 20
```

Restricciones:

```text
page >= 1
1 <= pageSize <= 100
```

### `selection-process-filter-options.ts`
Incluye:
- municipios;
- comarcas;
- provincias;
- jerarquía territorial;
- estados;
- ámbitos;
- sistemas de selección;
- tipos de personal;
- grupos de titulación.

Jerarquía territorial:

```ts
export type SelectionProcessTerritoryOption = {
  province: string;
  county: string | null;
  municipality: string | null;
};
```

### `get-selection-process-filter-options.ts`
Obtiene las opciones reales disponibles desde PostgreSQL.

# 3. Infrastructure

## `PrismaSelectionProcessQueryRepository`

Ruta:

```text
src/modules/selection-process/infrastructure/prisma/
prisma-selection-process-query-repository.ts
```

Responsabilidades:
- consultar convocatorias activas;
- aplicar filtros;
- aplicar paginación;
- construir opciones de filtro;
- construir jerarquía territorial;
- ejecutar búsqueda tolerante;
- calcular ranking por relevancia.

# 4. Convocatorias activas

El listado devuelve únicamente:

```text
sourceActive = true
```

Las convocatorias históricas permanecen almacenadas, pero no aparecen en el buscador principal mientras `sourceActive = false`.

# 5. Filtros implementados

Todos los filtros se combinan mediante **AND**.

Ejemplo:

```text
texto = informatic
AND provincia = Barcelona
AND comarca = Vallès Oriental
AND grupo = A2
AND estado = Termini obert
```

## 5.1 Tipo de convocatoria

Campo:

```text
isJobPool
```

Comportamiento:

```text
Plazas solamente     → false
Bolsas solamente     → true
Ambas seleccionadas  → sin filtro
Ninguna seleccionada → sin filtro
```

## 5.2 Estado
Campo:

```text
statusId
```

Las opciones se cargan desde PostgreSQL.

## 5.3 Grupo de titulación
Campo:

```text
qualificationGroup
```

Permite selección múltiple, por ejemplo:

```text
A2 + C1
```

equivale conceptualmente a:

```text
qualificationGroup IN ("A2", "C1")
```

## 5.4 Ámbito
Campo:

```text
scopeId
```

## 5.5 Sistema de selección
Campo:

```text
selectionSystemId
```

## 5.6 Tipo de personal
Campo:

```text
personnelTypeId
```

## 5.7 Fecha límite
Campo:

```text
applicationEndDate
```

Filtros:

```text
applicationEndDateFrom
applicationEndDateTo
```

## 5.8 Reservas

```text
reservedDisability
reservedUnemployed
reservedYoung
reservedWomen
```

Discapacidad se considera activa cuando:

```text
reservedDisabilityPositions > 0
```

# 6. Filtros territoriales

Se basan en `Institution`:

```text
province
county
municipality
```

Jerarquía:

```text
Provincia
    ↓
Comarca
    ↓
Municipio
```

Al cambiar provincia:
- se recalculan las comarcas;
- se limpia la comarca anterior;
- se limpia el municipio anterior.

Al cambiar comarca:
- se recalculan los municipios;
- se limpia el municipio anterior.

Componente:

```text
src/app/convocatorias/territory-filters.tsx
```

La consulta aplica provincia, comarca y municipio sobre la misma relación `institution`:

```text
Institution
    province = Barcelona
AND county = Vallès Oriental
AND municipality = Cardedeu
```

# 7. Búsqueda libre

Parámetro:

```text
q
```

Campos considerados:
- título;
- nombre de institución;
- municipio;
- comarca;
- provincia;
- grupo de titulación.

# 8. Búsqueda tolerante

Extensiones PostgreSQL:

```sql
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

## 8.1 `unaccent`
Ignora acentos y diacríticos:

```text
tecnic        → Tècnic
informatic    → Informàtic
administracio → Administració
valles        → Vallès
```

## 8.2 `pg_trgm`
Se utiliza `word_similarity()` para pequeñas variaciones.

Ejemplo:

```text
informatics → informàtic
```

## 8.3 Umbral

```text
score >= 0.55
```

# 9. Varias palabras

Ejemplo:

```text
cardedeu informatic
```

se interpreta como:

```text
cardedeu
AND
informatic
```

Cada término puede aparecer en un campo distinto.

# 10. Ranking por relevancia

Para cada término se toma la mejor coincidencia mediante `GREATEST()`.

| Campo | Coincidencia directa | Aproximada |
|---|---:|---:|
| Título | 2.0 | hasta 1.5 |
| Organismo | 1.4 | hasta 1.1 |
| Municipio | 1.0 | hasta 1.0 |
| Comarca | 1.0 | hasta 1.0 |
| Provincia | 1.0 | hasta 1.0 |
| Grupo de titulación | 0.8 | hasta 0.7 |

El título tiene mayor peso porque normalmente el usuario busca el puesto.

Con varias palabras, las puntuaciones se suman.

# 11. Orden de resultados

## Con texto

```text
relevancia DESC
```

## Sin texto

```text
applicationEndDate ASC NULLS LAST
id ASC
```

# 12. Paginación

Configuración principal:

```text
20 resultados por página
```

Resultado:

```text
page
pageSize
totalItems
totalPages
```

La URL conserva todos los filtros y el texto de búsqueda.

# 13. Interfaz `/convocatorias`

La página:
- es accesible sin autenticación;
- usa PostgreSQL real;
- muestra filtros;
- muestra total de resultados;
- muestra tarjetas;
- permite paginar;
- conserva filtros.

Cada tarjeta muestra:
- plaza o bolsa;
- estado;
- título;
- institución;
- municipio;
- comarca;
- provincia;
- grupo;
- fecha límite;
- enlace oficial CIDO.

# 14. Rutas temporales de debug

Tras validar el buscador, dejan de ser necesarias:

```text
src/app/api/debug/convocatorias/route.ts
src/app/api/debug/convocatorias/filtros/route.ts
```

# 15. Tests unitarios

Archivo:

```text
src/modules/selection-process/application/
list-active-selection-processes.test.ts
```

Validan:
- valores por defecto;
- filtros enviados al repositorio;
- resultado devuelto;
- validación de `page`;
- validación de `pageSize`.

# 16. Tests de integración

Archivo:

```text
src/modules/selection-process/infrastructure/prisma/
prisma-selection-process-query-repository.test.ts
```

Se ejecutan contra PostgreSQL real usando una base separada:

```text
convocam_test
```

Configuración:

```text
.env.test
```

Validan:
- exclusión de `sourceActive = false`;
- territorio;
- varios grupos;
- plaza / bolsa;
- búsqueda sin acentos;
- búsqueda tolerante;
- ranking;
- paginación;
- orden por fecha sin texto.

La base de test debe tener aplicadas todas las migraciones, incluidas:

```text
unaccent
pg_trgm
```

# 17. Composition Root

En:

```text
src/composition/selection-process.ts
```

```ts
const selectionProcessQueryRepository =
  new PrismaSelectionProcessQueryRepository(prisma);

export const listActiveSelectionProcessesUseCase =
  new ListActiveSelectionProcesses(
    selectionProcessQueryRepository,
  );

export const getSelectionProcessFilterOptionsUseCase =
  new GetSelectionProcessFilterOptions(
    selectionProcessQueryRepository,
  );
```

Next.js consume los casos de uso y no instancia Prisma directamente.

# 18. Decisiones de diseño

## No usar IA para la búsqueda
La búsqueda se resuelve con PostgreSQL porque es:
- simple;
- determinista;
- rápida;
- suficiente para el dominio.

La IA se reserva para análisis de documentación oficial.

## No implementar todavía filtro por tipo de administración
No se añade todavía:

```text
Ayuntamiento
Generalitat
Diputación
Consejo comarcal
Otros organismos
```

porque el modelo actual no dispone de una clasificación explícita y fiable.

# 19. Criterios de aceptación

- [x] `/convocatorias` utiliza PostgreSQL real.
- [x] Solo se muestran convocatorias activas.
- [x] La búsqueda libre funciona.
- [x] La búsqueda ignora acentos.
- [x] Tolera pequeñas variaciones.
- [x] Varias palabras se combinan mediante AND.
- [x] Con texto se ordena por relevancia.
- [x] Sin texto se ordena por fecha límite.
- [x] Funciona plaza / bolsa.
- [x] Funciona estado.
- [x] Funciona selección múltiple de grupos.
- [x] Funciona ámbito.
- [x] Funciona sistema de selección.
- [x] Funciona tipo de personal.
- [x] Funciona rango de fechas.
- [x] Funcionan reservas.
- [x] Provincia, comarca y municipio son dependientes.
- [x] Territorio se aplica sobre la misma institución.
- [x] Los filtros pueden combinarse.
- [x] La paginación conserva filtros.
- [x] La búsqueda conserva filtros.
- [x] Las opciones proceden de PostgreSQL.
- [x] Existen tests unitarios.
- [x] Existen tests de integración.
- [x] Los tests de integración usan una base separada.

# 20. Resultado final

Con SPEC-004 Convoca'm dispone de un buscador funcional de convocatorias basado en datos sincronizados desde CIDO.

El usuario puede:

```text
buscar
+
filtrar
+
combinar criterios
+
navegar por territorio
+
obtener resultados tolerantes
+
recibir primero los resultados más relevantes
```

La siguiente especificación es:

```text
SPEC-005 — Detalle de convocatoria
```
