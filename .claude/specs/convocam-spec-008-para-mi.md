# SPEC-008 — «Para mí»: convocatorias personalizadas para el opositor

**Proyecto:** Convoca'm — Portal personal del opositor en Catalunya  
**Estado:** FINALIZADA Y VALIDADA  
**Fecha de cierre funcional original:** 18/10/2026  
**Actualización documental:** 23/10/2026 (evolución SPEC-010)  
**Versión:** 1.1 consolidada  
**Dependencias:** SPEC-003 (CIDO), SPEC-004 (buscador), SPEC-005 (detalle), SPEC-006 (seguimiento), SPEC-007 (perfil y preferencias)  
**Evolución posterior:** SPEC-009 (Dashboard) y SPEC-010 (mapas, recomendaciones no seguidas y estabilización)

---

## 1. Objetivo

Implementar una página personalizada que muestre a cada usuario autenticado las convocatorias de CIDO que coinciden con sus preferencias territoriales y profesionales guardadas en «Mi perfil», ordenadas por la utilidad temporal de sus plazos de solicitud.

La finalidad es que el opositor no tenga que repetir manualmente sus filtros y pueda descubrir, consultar y seguir las convocatorias que le interesan.

La página se denomina **«Para mí»** y se encuentra en **`/para-mi`**.

**Comportamiento vigente tras SPEC-010:** las recomendaciones solo incluyen procesos compatibles que el usuario **todavía no sigue**. Se muestran en un listado con mapa territorial compartido y el total se calcula sin convocatorias seguidas. La implementación de estos cambios se cierra en SPEC-010; se incorporan aquí para que SPEC-008 describa el resultado final.

## 2. Alcance y decisiones generales

- Se reutilizan los datos de convocatorias e instituciones sincronizados desde CIDO y las preferencias existentes de SPEC-007.
- «Para mí» es **independiente** del buscador general **`/convocatorias`**. No sustituye su interfaz ni cambia sus filtros u ordenaciones habituales.
- Para consultar «Para mí» es obligatorio iniciar sesión mediante Better Auth.
- La funcionalidad utiliza los mecanismos de seguimiento de SPEC-006; no crea un segundo sistema de convocatorias seguidas.
- No se incorpora una nueva fuente de convocatorias ni se almacenan documentos PDF.
- No se añaden preferencias de jornada laboral: se mantiene la decisión de SPEC-007.
- No se requiere una tabla específica para almacenar los resultados personalizados: se obtienen con consultas a los datos existentes.

- La ampliación posterior de SPEC-010 incorpora un mapa de municipios y excluye los procesos que ya están en seguimiento; las reglas originales de compatibilidad no cambian.

## 3. Reglas funcionales

### 3.1. Convocatorias candidatas

La consulta de «Para mí» parte de convocatorias activas en la fuente (`sourceActive = true`) y restringe los estados oficiales CIDO a:

| ID CIDO | Estado oficial |
| --- | --- |
| `2` | Pendiente de plazo |
| `3` | Plazo abierto |

Estos estados oficiales se utilizan como **filtro de entrada**, pero no determinan el orden de los resultados. La situación real del plazo se calcula a partir de las fechas disponibles.

**Exclusión adicional vigente (SPEC-010):** un proceso ya seguido por el usuario no es candidato visible en «Para mí». La exclusión se aplica en la consulta, no ocultando tarjetas después de paginar.

### 3.2. Preferencias territoriales

Se utilizan las preferencias guardadas en SPEC-007:

- **Toda Catalunya (`ALL_CATALONIA`):** no se limita la consulta a territorios concretos.
- **Territorios seleccionados (`SELECTED_TERRITORIES`):** se buscan coincidencias con cualquiera de las provincias, comarcas o municipios seleccionados.
- Las distintas selecciones territoriales se combinan mediante **OR**: una provincia, una comarca o un municipio pueden hacer coincidir la convocatoria.
- La identificación territorial utiliza las entidades del catálogo territorial y los datos disponibles de las instituciones CIDO; contempla códigos y nombres normalizados para resolver correspondencias.
- Cuando se seleccionan territorios y no se encuentran instituciones coincidentes, el filtro devuelve cero resultados; nunca se ignora silenciosamente.

**Limitación importante:** el territorio se determina a partir de la **ubicación del organismo convocante**, que no garantiza que sea el lugar de trabajo de la plaza. Esta advertencia se muestra al usuario.

### 3.3. Preferencias profesionales

Se aplican las preferencias profesionales de SPEC-007:

| Preferencia | Comportamiento |
| --- | --- |
| Tipo de convocatoria | Plazas de plantilla, bolsas de trabajo o ambas |
| Materias profesionales CIDO | Una convocatoria coincide si tiene **al menos una** de las materias seleccionadas |
| Grupos de titulación CIDO | Una convocatoria coincide si pertenece a **alguno** de los grupos elegidos |

Se cumplen las siguientes reglas:

- **OR dentro de cada grupo** con varias opciones seleccionadas.
- **AND entre grupos de preferencias** que estén configurados: territorio, tipo de convocatoria, materias y grupos de titulación.
- Las categorías no restringidas por el perfil no introducen filtros adicionales.
- Las preferencias pueden editarse desde «Mi perfil», sin duplicar formularios en «Para mí».

### 3.4. Ordenación por plazos de solicitud

Se adoptó una ordenación por fechas, **no una ordenación por el estado oficial CIDO**, tras la revisión funcional del usuario.

| Prioridad | Situación calculada | Orden dentro del grupo |
| --- | --- | --- |
| 1 | Plazo de solicitud abierto | Primero el que **antes finaliza** |
| 2 | Plazo todavía no iniciado | Primero el que **antes comienza** |
| 3 | Plazo sin fechas suficientes para determinarlo | Primero el de **publicación más reciente del último documento** |
| 4 | Plazo finalizado | Primero el que **más recientemente finalizó** |

Las comparaciones de días se basan en la fecha de Catalunya (`Europe/Madrid`). Si hay empate en el criterio temporal, se utiliza el identificador para proporcionar un orden estable.

La ordenación y la paginación se efectúan en la capa de consulta de PostgreSQL/Prisma, **antes de devolver los elementos de la página**, evitando ordenar únicamente los diez resultados visibles.

**Matiz:** dado que se mantiene el filtro oficial de entrada `statusId IN (2, 3)`, pueden aparecer convocatorias con fechas calculadas desconocidas o finalizadas si CIDO todavía conserva esos estados oficiales.

### 3.5. Paginación

- Se muestran **10 convocatorias por página**.
- La página se expresa mediante el parámetro de consulta `page` (`/para-mi?page=2`).
- Si `page` no es válido, se parte de la primera página.
- Si la página solicitada excede las disponibles, el caso de uso la ajusta a un rango válido.
- Se muestran el total de coincidencias, el número de página y los controles anterior/siguiente cuando correspondan.

- El total, las páginas y los elementos de cada página excluyen **antes de paginar** todas las convocatorias ya seguidas por el usuario.
- Si, tras seguir una convocatoria, la página solicitada queda fuera de rango, el caso de uso ajusta la página al nuevo total válido.
- El filtro por municipio (SPEC-010) restringe las tarjetas del listado sin cambiar las preferencias guardadas ni el conjunto global de marcadores compatibles.

### 3.6. Seguimiento personal (comportamiento vigente tras SPEC-010)

Todas las tarjetas visibles en «Para mí» corresponden a convocatorias **no seguidas** por el usuario autenticado.

- Cada tarjeta ofrece **«Seguir convocatoria»**, que reutiliza la acción de servidor autenticada y los casos de uso de SPEC-006.
- Al seguirla, la convocatoria **desaparece de «Para mí»**; no permanece con otro color ni con un botón «Mi seguimiento».
- El total de nuevas coincidencias, la paginación y los contadores de municipios del mapa se recalculan para excluirla.
- El seguimiento se conserva y gestiona en **`/mis-convocatorias`**. No se elimina ni se cambia automáticamente su estado personal.
- Desde el detalle de una convocatoria se mantienen las funciones de seguimiento y cambio de estado definidas por SPEC-005 y SPEC-006.

**Aplicación técnica:** `ListSelectionProcessesForMe` recibe `excludeFollowed: true`. El filtro de consulta `excludeFollowedByUserId` se aplica sobre los seguimientos de ese usuario **antes de contar, ordenar, paginar y agrupar los puntos del mapa**. El Dashboard utiliza el mismo criterio desde SPEC-009.

### 3.7. Navegación y retorno al listado

Al abrir una convocatoria desde «Para mí», el enlace al detalle transmite `returnTo` con la ruta y la página de origen. El botón de regreso del detalle vuelve a «Para mí» y recupera su paginación.

La validación del destino de retorno acepta únicamente rutas internas conocidas, entre ellas `/convocatorias`, `/para-mi` y `/mis-convocatorias`, para evitar redirecciones arbitrarias.

### 3.8. Filtro municipal y mapa (ampliación SPEC-010)

- El listado acepta `municipality` y, cuando procede, `province` en la URL, además de `page`.
- Clicar un marcador del mapa limita las tarjetas a ese municipio; **«Quitar filtro»** permite regresar al conjunto de oportunidades.
- Los marcadores se calculan a partir de **todas las recomendaciones no seguidas compatibles**, no solo de las diez tarjetas de la página ni del municipio seleccionado.
- Cada marcador representa un municipio con ubicación disponible e indica el número de convocatorias que lo cumplen.
- Las convocatorias sin coordenadas representables pueden seguir apareciendo en el listado, sin inventar posiciones cartográficas.
- La interfaz se adapta a escritorio y móvil, reutilizando el mapa implementado en SPEC-010 para otras pantallas.

## 4. Interfaz y experiencia de usuario

### 4.1. Página principal

Ruta: **`/para-mi`**.

Incluye:

- Cabecera «Para mí» y descripción de recomendaciones **compatibles todavía no seguidas**.
- Botón **«Editar mis preferencias»** hacia `/mi-perfil`.
- Número total de nuevas convocatorias encontradas y paginación de 10 resultados.
- **Listado a la izquierda (65 %) y mapa a la derecha (35 %)** en escritorio ancho; disposición apilada en pantallas más estrechas.
- Tarjetas con estado oficial CIDO, tipo plaza/bolsa, título, municipio/comarca del organismo, situación y fechas del plazo.
- Apartado **«¿Por qué aparece para mí?»** con los criterios de preferencias que intervienen en la coincidencia.
- Acciones **Fuente oficial**, **Ver detalle** y **Seguir convocatoria**.
- Mapa interactivo con marcadores municipales, contadores, zoom, vista ampliada y clic para filtrar el listado.
- Nota informativa sobre la necesidad de revisar las bases oficiales de cada convocatoria.

Las etiquetas «¿Por qué aparece para mí?» **describen los tipos de criterios de perfil utilizados**; no constituyen una justificación individual exhaustiva ni una puntuación de cada convocatoria.

### 4.2. Diseño final de tarjetas y mapa

1. **Una tarjeta por fila** en la columna izquierda. La estructura flexible mantiene las acciones en la parte inferior y el contenido legible, sin altura fija ni recorte arbitrario de títulos.
2. **Distribución 65 % / 35 %** para tarjetas y mapa en escritorio ancho; en tablet y móvil se apilan.
3. **Tarjetas no seguidas** con fondo blanco: las que ya sigue el usuario no se muestran.
4. **Sin badge, fondo diferenciado ni enlace «Mi seguimiento»** dentro de «Para mí», porque corresponderían a tarjetas seguidas que ahora se excluyen.
5. **Mapa compartido** con «Mis convocatorias», aprovechando los marcadores y el filtro municipal; la cuenta de un marcador no está limitada por la paginación.
6. El estado del municipio elegido se refleja en la URL y puede retirarse con «Quitar filtro».

**Trazabilidad:** la primera versión cerrada el 18/10/2026 utilizaba dos columnas de tarjetas, resaltaba el fondo de las seguidas y mostraba «Mi seguimiento». Las tres decisiones quedaron **sustituidas**, no vigentes, por el mapa 65/35 y la exclusión aprobados en SPEC-010 (23/10/2026).

### 4.3. Estados de la pantalla

- **Sin preferencias configuradas:** explicación y acceso a `/mi-perfil`.
- **Sin oportunidades nuevas:** mensaje «No hay nuevas convocatorias para ti»; puede deberse a que no existen coincidencias o a que ya se siguen todas.
- **Sin oportunidades en el municipio elegido:** mensaje específico y posibilidad de seleccionar otro marcador o quitar el filtro.
- **Con oportunidades:** listado paginado de tarjetas no seguidas y mapa de los municipios compatibles representables.
- **Usuario no autenticado:** redirección a `/login?returnTo=/para-mi`.
- **Carga y error:** componentes de carga y recuperación de errores de la ruta.

## 5. Arquitectura técnica

Se mantiene **Clean Architecture**: reglas de compatibilidad en aplicación, consultas en infraestructura Prisma/PostgreSQL y representación cartográfica en la capa de presentación. La actualización de SPEC-010 reutiliza contratos y componentes existentes.

| Capa / responsabilidad | Implementación relevante |
| --- | --- |
| Aplicación: caso de uso | `src/modules/selection-process/application/list-selection-processes-for-me.ts` |
| Aplicación: filtros de búsqueda | `src/modules/selection-process/application/selection-process-search-filters.ts` |
| Aplicación: consulta agregada para mapa | `src/modules/selection-process/application/selection-process-municipality-map-point.ts` y contratos de consulta municipal |
| Infraestructura: consultas, ordenación, exclusión y municipios | `src/modules/selection-process/infrastructure/prisma/prisma-selection-process-query-repository.ts` |
| Composition Root | `src/composition/selection-process.ts` |
| Presentación: página personalizada | `src/app/para-mi/page.tsx` |
| Presentación: seguimiento desde la tarjeta | `src/app/para-mi/actions.ts` |
| Presentación: mapa compartido | `src/modules/user-selection-process/presentation/followed-municipalities-map.tsx` |
| Presentación: mapa ICGC/MapLibre | `src/modules/user-selection-process/presentation/icgc-municipalities-map.tsx` |
| Presentación: carga y errores | `src/app/para-mi/loading.tsx` y `src/app/para-mi/error.tsx` |
| Navegación principal | `src/components/layout/app-sidebar.tsx` |
| Navegación desde el detalle | `src/app/convocatorias/[id]/page.tsx` |
| Pruebas de caso de uso | `src/modules/selection-process/application/list-selection-processes-for-me.test.ts` |

**Dependencias reutilizadas:** casos de uso de preferencias territoriales y profesionales (SPEC-007), datos y filtros CIDO (SPEC-003/004), Better Auth y seguimiento personal (SPEC-006).

### 5.1. Flujo simplificado vigente

```text
Usuario autenticado -> /para-mi
                  |
                  v
       ListSelectionProcessesForMe
                  |
                  v
     Preferencias territoriales y profesionales
                  |
                  v
     Estados CIDO 2/3 + AND/OR + excludeFollowed
                  |
                  v
     Repositorio Prisma / PostgreSQL
                  |
           +------+------------------+
           |                         |
           v                         v
   Resultados paginados       Municipios agregados
   (10 por pagina)            (sin paginar)
           |                         |
           v                         v
   Tarjetas y contador        Mapa + marcadores
           +------------+------------+
                        |
                        v
         Seguir / Ver detalle / Filtrar municipio
```

**Coherencia de resultados:** ambos brazos parten de los mismos filtros base, incluida la exclusión del usuario; el filtro de municipio elegido se aplica a las tarjetas, pero no elimina los demás marcadores del mapa.

### 5.2. Compatibilidad y evolución con otras SPEC

- **SPEC-004:** se mantienen los filtros, las consultas y la accesibilidad pública del buscador general; «Para mí» sigue siendo una sección autenticada e independiente.
- **SPEC-005:** el detalle acepta retorno seguro hacia la página y municipio de origen.
- **SPEC-006:** el seguimiento de una convocatoria sigue siendo un registro personal existente; ahora la convocatoria seguida sale de las recomendaciones y aparece en «Mis convocatorias».
- **SPEC-007:** se mantienen las preferencias y sus reglas de selección territorial/profesional.
- **SPEC-009:** el Dashboard comparte `excludeFollowed: true` para sus «Oportunidades para mí» y el contador correspondiente.
- **SPEC-010:** consolida el mapa 65/35, los marcadores no paginados, el filtro municipal y la exclusión de seguidas en toda la vista personalizada.

## 6. Correcciones y decisiones durante el desarrollo

| Tema | Decisión o solución final |
| --- | --- |
| Orden incorrecto por estado CIDO | Sustituido por prioridad basada en fechas de solicitud, no por el estado oficial. |
| Filtros territoriales múltiples | OR dentro de provincias/comarcas/municipios; consulta anterior a paginación. |
| Filtros profesionales | AND entre categorías configuradas y OR entre alternativas. |
| Regreso desde detalle | Conservación segura de `returnTo`, página y contexto municipal. |
| Tarjetas desalineadas | Primera versión con altura uniforme por fila; el diseño final cambia a una tarjeta por fila junto al mapa. |
| Enlace «Mi seguimiento» y fondo azul | **Decisión histórica sustituida**: en la versión final no se muestran convocatorias seguidas. |
| Badge de seguimiento | No se necesita en «Para mí» porque solo hay oportunidades aún no seguidas. |
| Inclusión del mapa | Reutilización del mapa municipal en distribución 65/35. |
| Contador, paginación y marcadores | Comparten la exclusión `excludeFollowedByUserId` antes de paginar o agrupar. |
| Filtro por marcador | Acota el listado a un municipio sin eliminar el resto de marcadores. |
| Búsqueda de municipios de «Mi perfil» | Filtrado por nombre normalizado, evitando coincidencias masivas por provincia/comarca. |

**Cronología:** SPEC-008 se cerró el 18/10/2026. Las adaptaciones cartográficas y la exclusión final del seguimiento se aprobaron y validaron en SPEC-010 hasta el 23/10/2026.

## 7. Validación y pruebas

La validación se ha efectuado por bloques; los resultados funcionales y técnicos citados fueron comunicados por el usuario desde su entorno local. No representan ejecuciones independientes realizadas al actualizar este documento.

### 7.1. Pruebas funcionales verificadas

- [x] Listado de estados oficiales CIDO 2 y 3.
- [x] Ordenación por fechas: abiertas, futuras, desconocidas y finalizadas.
- [x] Preferencias territoriales y profesionales: OR dentro de grupos, AND entre grupos configurados.
- [x] Seguimiento de convocatorias desde «Para mí».
- [x] Navegación a detalle y regreso conservando página de origen.
- [x] Paginación y corrección de páginas fuera de rango.
- [x] Estados sin preferencias, sin coincidencias y acceso no autenticado.
- [x] Diseño final de una tarjeta por fila, listado/mapa 65/35 y respuesta móvil.
- [x] Marcadores y contadores municipales basados en todas las coincidencias, no solo en la página actual.
- [x] Filtrado de tarjetas por marcador municipal y opción para quitar el filtro.
- [x] **Exclusión de convocatorias ya seguidas**, con actualización de listado, contador, paginación y mapa.
- [x] Verificación de que la convocatoria seguida permanece en «Mis convocatorias».
- [x] Búsqueda de municipios de preferencias territoriales corregida.
- [x] Pruebas de regresión VF-01 a VF-06 de SPEC-010, incluida la visualización móvil y los mapas privados.

### 7.2. Validación técnica final

El proyecto superó, según confirmación del usuario, las comprobaciones finales realizadas al cerrar SPEC-010:

```bash
pnpm exec tsc --noEmit
pnpm exec vitest run
pnpm build
```

Asimismo se confirmó que los problemas de ESLint fueron resueltos. Durante VT-03 se corrigió el límite `Suspense` de `/login` antes de obtener un `pnpm build` satisfactorio.

El caso de uso original de «Para mí» dispone de pruebas automatizadas en `list-selection-processes-for-me.test.ts` (10 casos documentados durante su implementación).

**Referencia de evidencia:** SPEC-010, apartados de matriz funcional VF-01 a VF-06 y validación técnica VT-01 a VT-03. La presente revisión es documental.

## 8. Limitaciones conocidas y fuera de alcance

- Las coincidencias dependen de la información sincronizada desde CIDO y de las preferencias guardadas.
- La ubicación del organismo convocante no identifica necesariamente el lugar de trabajo.
- Las convocatorias sin coordenadas representables pueden constar en el listado aunque no generen un marcador propio.
- «Para mí» no comprueba automáticamente si el usuario cumple los requisitos legales o académicos de participación.
- Los motivos de coincidencia representan **criterios generales activos**, no una explicación individual detallada o puntuación de adecuación.
- No se amplía el ámbito geográfico fuera de Catalunya ni se incorpora análisis de bases mediante IA en esta SPEC.
- No se implementan avisos, notificaciones periódicas ni nuevas funciones de alertas.
- No se modifica el catálogo de preferencias de SPEC-007 ni se incorpora jornada laboral.

## 9. Criterios de aceptación y cierre

La especificación y su evolución se consideran finalizadas porque:

1. Existe una ruta personalizada y accesible desde el menú lateral, protegida mediante autenticación.
2. La consulta aplica las preferencias territoriales y profesionales persistidas del usuario y los estados oficiales CIDO previstos.
3. Los resultados se ordenan por plazos y se paginan correctamente.
4. **Solo se recomiendan convocatorias que el usuario todavía no sigue.** El seguimiento se aplica antes del recuento, paginación y agrupación cartográfica.
5. La interfaz combina una tarjeta por fila y mapa municipal compartido en distribución 65/35, con soporte responsive.
6. La navegación, el filtro municipal, los estados vacíos y el acceso a fuentes oficiales están contemplados.
7. Los cambios de SPEC-010 relativos a «Para mí» fueron probados y validados por el usuario.
8. TypeScript, Vitest, ESLint y el build de producción quedaron validados a nivel del proyecto durante la estabilización.

**Resultado final: SPEC-008 FINALIZADA Y VALIDADA, con ampliaciones de SPEC-010 integradas documentalmente el 23/10/2026.**

---

## 10. Evolución y documentación relacionada

La previsión original de continuar con SPEC-009 se ha completado. En la fase posterior, SPEC-010 aportó el mapa compartido, la nueva presentación de las recomendaciones y la exclusión de convocatorias ya seguidas.

- **SPEC-009.md:** Dashboard personal y público, con contador de oportunidades no seguidas.
- **SPEC-010.md:** fuente de trazabilidad para la evolución de «Para mí» y las validaciones finales.

**No se requieren modificaciones de código por esta revisión documental.**

