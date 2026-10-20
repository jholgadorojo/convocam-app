# SPEC-009 - Dashboard del opositor

**Proyecto:** Convoca'm - Portal personal de oposiciones de Catalunya  
**Documento:** SPEC-009.md  
**Estado:** Implementada, validada y cerrada para la fase de desarrollo  
**Fecha de cierre:** 20/10/2026  
**Pendiente para producción:** Recuperar el criterio definitivo de publicaciones oficiales (ver apartado 9).

---

## 1. Objetivo

Convertir `/dashboard` en el punto de entrada principal de Convoca'm, con una vista pública para descubrir convocatorias y una vista personal, accesible tras iniciar sesión, que resuma seguimientos, plazos, oportunidades ajustadas al perfil y publicaciones oficiales.

La pantalla reutiliza la información y los casos de uso creados en SPEC-003 (CIDO), SPEC-004 (buscador), SPEC-005 (detalle), SPEC-006 (seguimiento), SPEC-007 (perfil) y SPEC-008 (Para mí). Se mantiene **Clean Architecture**, con textos de interfaz en castellano.

## 2. Alcance y acceso

- **Ruta:** `/dashboard`.
- **Visitantes:** pueden acceder sin autenticación; no se consultan ni muestran datos personales.
- **Usuarios autenticados:** acceden al resumen de sus propios datos, utilizando el identificador de la sesión de Better Auth.
- **Fuente de convocatorias y documentos:** PostgreSQL, con información oficial sincronizada desde CIDO.
- **Documentos oficiales:** se conservan los enlaces a la fuente; no se descargan ni almacenan los PDF en la aplicación.
- No se requieren tablas nuevas ni migraciones Prisma para SPEC-009.

## 3. Diseño funcional final

### 3.1. Elementos comunes

- Cabecera `AppHeader` y menú lateral `AppSidebar`, con `dashboard` como opción activa.
- Diseño adaptable a pantallas de diferentes tamaños.
- **No existe un buscador de texto duplicado en la parte superior del dashboard**: la búsqueda se realiza desde la opción del menú lateral.

### 3.2. Dashboard para visitantes

- Mensaje de bienvenida y explicación del portal.
- Dos contadores con datos reales de CIDO:
  - **Plazo abierto:** `statusId = 3`.
  - **Pendiente de plazo:** `statusId = 2`.
- Los contadores enlazan al buscador con el filtro correspondiente: `/convocatorias?statusId=3&statusFilterApplied=1` y `/convocatorias?statusId=2&statusFilterApplied=1`.
- Accesos informativos a Buscar, Guardar y Seguir; las acciones personales conducen a iniciar sesión.
- Invitación a iniciar sesión o crear una cuenta.
- La vista no muestra seguimiento, perfil, coincidencias ni documentos personales de ningún usuario.

### 3.3. Dashboard para usuarios autenticados

- Bienvenida con el primer nombre disponible en la sesión.
- Tres tarjetas de indicadores, con acceso a sus secciones correspondientes:
  1. **En seguimiento:** número total de convocatorias que sigue el usuario, con independencia del estado oficial o personal.
  2. **Plazos próximos:** número de convocatorias seguidas que cumplen el criterio de vencimiento próximo.
  3. **Para mí:** número de coincidencias con el perfil que todavía no sigue el usuario. Si faltan preferencias, se presenta un estado informativo y un acceso a `/mi-perfil`.
- Dos paneles principales con distribución aproximada del **55 % / 45 %** en pantallas grandes:
  - **Plazos próximos:** columna izquierda, máximo cinco convocatorias.
  - **Oportunidades para mí:** columna derecha, máximo tres convocatorias.
- Un panel de **Últimas publicaciones oficiales**, a ancho completo, debajo de los dos anteriores; máximo cinco documentos.
- Mensajes específicos cuando un panel no contiene resultados.
- Los títulos completos son legibles y no deben recortarse arbitrariamente.

### 3.4. Plazos próximos

Criterios aprobados:

- Solo convocatorias **seguidas por el usuario**.
- Solo los estados personales `INTERESTED` (Me interesa) y `PREPARING_APPLICATION` (Preparando solicitud).
- Fecha final de solicitud desde el **día de hoy** hasta **hoy + 15 días naturales**, con ambos extremos incluidos.
- El día actual se calcula conforme a `Europe/Madrid`, evitando desfases horarios.
- Contador de todos los elementos que cumplen el criterio; listado limitado a cinco, ordenado por fecha de vencimiento ascendente y con desempate estable.
- Cada elemento muestra el título, municipio, fecha de fin, días restantes, estado personal y botón **Ver detalle**.
- Indicadores de urgencia: **hoy en rojo**, **1-3 días en naranja** y **4-15 días en tono neutro**.
- No aparece un enlace redundante "Ver mis convocatorias" en el encabezado del panel.

### 3.5. Oportunidades para mí

- Reutiliza la búsqueda personalizada de SPEC-008 y las preferencias del perfil de SPEC-007.
- Se solicita la primera página con **tres elementos**.
- La consulta del dashboard utiliza la opción `excludeFollowed: true`: **las convocatorias ya seguidas se excluyen antes del recuento y la paginación**.
- El contador refleja el total de oportunidades nuevas, aunque solo se muestren tres.
- Conserva la prioridad y ordenación de SPEC-008.
- Se muestra el estado oficial, tipo plaza/bolsa, título, municipio e información de fecha disponible, con botón **Ver detalle**.
- **No hay botón Seguir convocatoria en el dashboard.** La decisión definitiva es revisar primero la ficha de detalle y seguir desde ella, reutilizando SPEC-006.
- No aparece un enlace redundante "Ir a Para mí" en el encabezado del panel.
- El funcionamiento habitual de `/para-mi` no se altera: allí se siguen visualizando las convocatorias que el usuario ya sigue, identificadas como tales.

### 3.6. Últimas publicaciones oficiales

Presentación final aprobada:

- Máximo cinco documentos, ordenados por `publicationDate DESC` y `id DESC`.
- Pueden aparecer varios documentos de una misma convocatoria.
- Fecha de publicación **destacada visualmente**, pero compacta; a su derecha se presenta el **título de la convocatoria** en tipografía destacada.
- Por debajo se conserva el resumen o título del documento, la fase oficial y el municipio.
- Botón **Ver convocatoria**, que abre el detalle de Convoca'm.
- Botón **Documento oficial**, que abre la URL oficial en una pestaña nueva.
- Los botones "Ver detalle", "Ver convocatoria" y "Documento oficial" comparten el estilo aprobado: fondo azul claro, borde azul suave y texto azul en negrita.
- No aparece un enlace redundante "Ver mis convocatorias" en el encabezado.

**IMPORTANTE - Comportamiento efectivo durante desarrollo:** se mantiene activado el modo temporal de los **últimos dos meses**, descrito en el apartado 9. No desactivarlo por el cierre de esta SPEC.

## 4. Reglas de navegación

- La selección de una convocatoria en el dashboard abre `/convocatorias/[id]` con el parámetro `returnTo=/dashboard` codificado en la URL.
- La función `getSafeResultsHref` del detalle admite `/dashboard` como origen seguro, además de `/convocatorias`, `/para-mi` y `/mis-convocatorias`.
- Desde un detalle abierto en el dashboard aparece **Volver al dashboard**, y el menú lateral marca Dashboard como sección activa.
- Los destinos de regreso se mantienen restringidos a rutas internas permitidas; no se admiten URLs externas arbitrarias mediante `returnTo`.
- El usuario ha probado y confirmado que el regreso desde el detalle funciona correctamente.

## 5. Arquitectura e implementación

### 5.1. Capas

```text
src/app/dashboard/page.tsx                (Presentation / Next.js)
             |
src/composition/dashboard.ts               (Composition Root)
             |
src/modules/dashboard/application/      (Application)
             |
src/modules/dashboard/infrastructure/   (Infrastructure / Prisma)
             |
          PostgreSQL
```

La consulta pública reutiliza el caso de uso de búsqueda de SPEC-004. Las oportunidades personalizadas reutilizan el caso de uso de SPEC-008. Los plazos y las publicaciones tienen contratos específicos del módulo dashboard.

### 5.2. Casos de uso

| Caso de uso | Responsabilidad |
| --- | --- |
| `GetPublicDashboardCounts` | Obtener contadores CIDO para estados 3 y 2; sin datos personales. |
| `GetPersonalDashboardDeadlines` | Contar seguimientos y plazos próximos; devolver cinco vencimientos con días restantes calculados en el calendario de Catalunya. |
| `ListSelectionProcessesForMe` (SPEC-008, ampliado) | Permitir uso optativo `excludeFollowed` para contabilizar y listar oportunidades nuevas desde el dashboard. |
| `GetDashboardLatestPublications` | Caso de uso definitivo que solicita las cinco publicaciones desde la fecha de seguimiento; queda implementado aunque **actualmente la página usa el modo temporal**. |

### 5.3. Repositorios

`DashboardQueryRepository` expone:

- `countFollowedByUser(userId)`.
- `countUpcomingDeadlines(query)`.
- `listUpcomingDeadlines(query)`.
- `listLatestOfficialPublications(query)`.

`PrismaDashboardQueryRepository` implementa las consultas de PostgreSQL. En la consulta **definitiva** de publicaciones, compara `publicationDate` con el **día local de Catalunya de `followedAt`** y mantiene el orden por fecha de publicación descendente e ID descendente. Se utilizan consultas parametrizadas.

En la ampliación de SPEC-008, `PrismaSelectionProcessQueryRepository` aplica `excludeFollowedByUserId` desde la consulta SQL/Prisma, antes del contador y la paginación.

### 5.4. Archivos principales implementados o modificados

**Módulo dashboard:**

- `src/modules/dashboard/application/dashboard-query-repository.ts`
- `src/modules/dashboard/application/get-public-dashboard-counts.ts`
- `src/modules/dashboard/application/get-personal-dashboard-deadlines.ts`
- `src/modules/dashboard/application/get-dashboard-latest-publications.ts`
- `src/modules/dashboard/infrastructure/prisma/prisma-dashboard-query-repository.ts`
- `src/composition/dashboard.ts`
- `src/app/dashboard/page.tsx`

**Integración con SPEC-008:**

- `src/modules/selection-process/application/selection-process-search-filters.ts`
- `src/modules/selection-process/application/list-selection-processes-for-me.ts`
- `src/modules/selection-process/infrastructure/prisma/prisma-selection-process-query-repository.ts`

**Navegación:**

- `src/app/convocatorias/[id]/page.tsx`

**Acción de seguimiento desarrollada pero descartada en el diseño final:**

- `src/app/dashboard/actions.ts` (`followFromDashboardAction`). La pantalla definitiva no muestra el botón de seguimiento directo; conviene verificar si el archivo quedó sin referencias y retirarlo en una limpieza posterior, sin alterar el comportamiento aprobado.

## 6. Pruebas automatizadas

Se añadieron o actualizaron pruebas de los casos de uso y repositorios:

- `get-public-dashboard-counts.test.ts`.
- `get-personal-dashboard-deadlines.test.ts`.
- `get-dashboard-latest-publications.test.ts`.
- `prisma-dashboard-query-repository.test.ts`.
- `list-selection-processes-for-me.test.ts`.
- `prisma-selection-process-query-repository.test.ts`.

**Validación final comunicada por el usuario:**

```bash
pnpm exec tsc --noEmit
pnpm exec vitest run
```

**Resultado:** ambos comandos ejecutados correctamente, sin errores reportados. No se inventa un número total de pruebas, porque no fue comunicado. Las pruebas que usan la base de datos dependen de la configuración del entorno de pruebas PostgreSQL.

## 7. Validación funcional manual

El usuario ha confirmado como correctos:

- Diseño final del dashboard público y autenticado.
- Contadores reales CIDO: plazo abierto y pendiente de plazo.
- Contador de convocatorias seguidas.
- Cálculo y listado de plazos próximos.
- Contador y listado de nuevas coincidencias "Para mí".
- Separación por usuario y ausencia de información personal en la vista pública.
- Publicaciones oficiales recientes: fecha, convocatoria, orden, límite, URL oficial y detalle.
- Navegación desde el dashboard hasta la convocatoria y regreso al dashboard.
- Ajustes visuales finales, incluidos botones y distribución de fecha y título de convocatoria.
- Comandos de TypeScript y Vitest correctos.

## 8. Decisiones expresas de diseño

1. El usuario debe revisar una convocatoria en su detalle antes de empezar a seguirla; no hay seguimiento directo desde las tarjetas del dashboard.
2. No se duplica el buscador superior: se usa el menú lateral.
3. Se conservan las tarjetas de indicadores y sus enlaces; se eliminan enlaces redundantes de los encabezados de los paneles de detalle.
4. Los botones para navegar a fichas y documentos mantienen un estilo visual unificado. Las etiquetas y destinos son distintos según su función.
5. El título **de la convocatoria** destaca junto a la fecha de publicación; no debe confundirse con el título del documento oficial.
6. No se crean nuevos estados "leído / no leído", alertas ni tablas para SPEC-009.
7. La vista `/para-mi` mantiene las convocatorias ya seguidas; solamente la consulta específica del dashboard las excluye.

## 9. Modo temporal de publicaciones: mantener durante desarrollo

**DECISIÓN CONFIRMADA: NO DESACTIVAR AHORA.**

En `src/app/dashboard/page.tsx` existe:

```ts
const TEST_RECENT_PUBLICATIONS = true;
```

**Con `true` (comportamiento actual aprobado):**

- Consulta en Prisma los documentos `sourceActive = true` pertenecientes a convocatorias seguidas por el usuario.
- Fecha de publicación comprendida entre la fecha local actual de Catalunya menos **dos meses naturales** y la fecha local de hoy, incluidos ambos extremos.
- No comprueba todavía que el documento se haya publicado después del día de seguimiento.
- Ordena por `publicationDate DESC`, `id DESC` y limita a cinco resultados.
- Su objetivo es disponer de documentos recientes reales para comprobar visual y funcionalmente el dashboard.

**Antes de pasar a producción (tarea obligatoria):**

1. Desactivar y retirar el modo de prueba (`TEST_RECENT_PUBLICATIONS` y `loadRecentPublicationsForTest`), sin afectar al diseño aprobado.
2. Utilizar exclusivamente `getDashboardLatestPublicationsUseCase.execute({ userId })`.
3. Volver al criterio definitivo: documentos activos publicados **desde el día local de Catalunya en que se empezó a seguir cada convocatoria**, incluyendo el propio día y sin la restricción artificial de los dos meses.
4. Revalidar la ordenación, el límite de cinco y el aislamiento de datos de usuario.
5. Ejecutar `pnpm exec tsc --noEmit` y `pnpm exec vitest run` y repetir la verificación funcional.
6. Revisar la acción de seguimiento directo del dashboard para eliminar código que ya no se utiliza, si procede.

La retirada del modo temporal **no forma parte del cierre de SPEC-009 en desarrollo** por decisión expresa del usuario. **No modificarlo hasta abordar la preparación de producción.**

## 10. Criterios de aceptación y cierre

| Criterio | Estado |
| --- | --- |
| Acceso público al dashboard sin datos personales | Validado |
| Contadores CIDO con sus filtros | Validado |
| Resumen personal y contadores | Validado |
| Plazos próximos y niveles de urgencia | Validado |
| Nuevas oportunidades personalizadas no seguidas | Validado |
| Publicaciones oficiales de los últimos dos meses (modo temporal) | Validado |
| Detalle, documento oficial y regreso a `/dashboard` | Validado |
| Interfaz final aprobada | Validada |
| TypeScript y Vitest | Confirmados correctos |
| Recuperación del criterio definitivo de publicaciones | **Pendiente para producción** |

**Conclusión:** SPEC-009 queda **finalizada y validada en desarrollo**, con el modo temporal de publicaciones deliberadamente activo. No se considera preparada para producción hasta completar la tarea descrita en el apartado 9.

---

*Documento de cierre de SPEC-009. La aplicación mantiene como referencia funcional las decisiones validadas por el usuario.*
