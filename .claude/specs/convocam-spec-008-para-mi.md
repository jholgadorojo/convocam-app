# SPEC-008 — «Para mí»: convocatorias personalizadas para el opositor

**Proyecto:** Convoca'm — Portal personal del opositor en Catalunya  
**Estado:** FINALIZADA Y VALIDADA  
**Fecha de cierre:** 18/10/2026  
**Dependencias:** SPEC-003 (CIDO), SPEC-004 (buscador), SPEC-005 (detalle), SPEC-006 (seguimiento), SPEC-007 (perfil y preferencias)  
**Siguiente especificación prevista:** SPEC-009 — Dashboard del opositor

---

## 1. Objetivo

Implementar una página personalizada que muestre a cada usuario autenticado las convocatorias de CIDO que coinciden con sus preferencias territoriales y profesionales guardadas en «Mi perfil», ordenadas por la utilidad temporal de sus plazos de solicitud.

La finalidad es que el opositor no tenga que repetir manualmente sus filtros y pueda descubrir, consultar y seguir las convocatorias que le interesan.

La página se denomina **«Para mí»** y se encuentra en **`/para-mi`**.

## 2. Alcance y decisiones generales

- Se reutilizan los datos de convocatorias e instituciones sincronizados desde CIDO y las preferencias existentes de SPEC-007.
- «Para mí» es **independiente** del buscador general **`/convocatorias`**. No sustituye su interfaz ni cambia sus filtros u ordenaciones habituales.
- Para consultar «Para mí» es obligatorio iniciar sesión mediante Better Auth.
- La funcionalidad utiliza los mecanismos de seguimiento de SPEC-006; no crea un segundo sistema de convocatorias seguidas.
- No se incorpora una nueva fuente de convocatorias ni se almacenan documentos PDF.
- No se añaden preferencias de jornada laboral: se mantiene la decisión de SPEC-007.
- No se requiere una tabla específica para almacenar los resultados personalizados: se obtienen con consultas a los datos existentes.

## 3. Reglas funcionales

### 3.1. Convocatorias candidatas

La consulta de «Para mí» parte de convocatorias activas en la fuente (`sourceActive = true`) y restringe los estados oficiales CIDO a:

| ID CIDO | Estado oficial |
| --- | --- |
| `2` | Pendiente de plazo |
| `3` | Plazo abierto |

Estos estados oficiales se utilizan como **filtro de entrada**, pero no determinan el orden de los resultados. La situación real del plazo se calcula a partir de las fechas disponibles.

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

### 3.6. Seguimiento personal

Desde una tarjeta de «Para mí»:

- Si no se sigue la convocatoria, aparece **«Seguir convocatoria»**, que utiliza una acción de servidor autenticada.
- Si ya se sigue, aparece el acceso **«Mi seguimiento»**, que lleva a `/mis-convocatorias`.
- El estado seguido/no seguido procede del seguimiento personal existente en SPEC-006.
- Tras seguir una convocatoria, se actualizan las vistas afectadas mediante la revalidación correspondiente.
- Los detalles de la convocatoria conservan su funcionalidad de seguimiento y cambio de estado personal.

### 3.7. Navegación y retorno al listado

Al abrir una convocatoria desde «Para mí», el enlace al detalle transmite `returnTo` con la ruta y la página de origen. El botón de regreso del detalle vuelve a «Para mí» y recupera su paginación.

La validación del destino de retorno acepta únicamente rutas internas conocidas, entre ellas `/convocatorias`, `/para-mi` y `/mis-convocatorias`, para evitar redirecciones arbitrarias.

## 4. Interfaz y experiencia de usuario

### 4.1. Página principal

Ruta: **`/para-mi`**.

Incluye:

- Cabecera «Para mí» y descripción de su finalidad.
- Botón **«Editar mis preferencias»** hacia `/mi-perfil`.
- Número de convocatorias encontradas y paginación.
- Tarjetas con estado oficial CIDO, tipo plaza/bolsa, título, municipio/comarca del organismo y situación/fechas del plazo.
- Apartado **«¿Por qué aparece para mí?»**, que presenta los tipos de preferencias aplicados.
- Acceso a la fuente oficial, al detalle y al seguimiento.
- Nota informativa sobre la necesidad de consultar las bases oficiales.

Las etiquetas «¿Por qué aparece para mí?» **describen los criterios de perfil utilizados para filtrar**, no una explicación granular o una puntuación calculada de cada coincidencia.

### 4.2. Diseño de tarjetas — mejoras aprobadas

Se aprobaron y validaron las siguientes modificaciones:

1. **Igual altura por fila** en la vista de dos columnas: el grid estira ambas tarjetas y su estructura flexible mantiene las acciones alineadas al pie.
2. **Sin altura fija y sin recorte de títulos**: la altura se adapta al contenido de la tarjeta más alta de cada fila.
3. **«Mi seguimiento» destacado**: enlace con icono de marcador, fondo azul suave y borde, en lugar de texto plano.
4. **Diferenciación visual de convocatorias seguidas**: las tarjetas seguidas utilizan fondo `#F5F7FF` y borde `#D9DFF3`; las no seguidas mantienen el fondo blanco.
5. **Eliminación del badge «En seguimiento»**: el fondo de la tarjeta indica visualmente el estado, sin duplicar información.
6. **Diseño adaptable**: dos columnas desde el ancho configurado; una columna en pantallas más estrechas.

### 4.3. Estados de la pantalla

- **Sin preferencias configuradas:** mensaje explicativo y acceso para configurarlas.
- **Sin coincidencias:** mensaje informativo y acceso para revisar las preferencias.
- **Con coincidencias:** listado paginado de tarjetas.
- **Usuario no autenticado:** redirección a inicio de sesión con retorno a `/para-mi`.
- **Carga y error:** componentes específicos de carga y recuperación de errores de la ruta.

## 5. Arquitectura técnica

Se mantiene la estructura Clean Architecture acordada para Convoca'm. «Para mí» reutiliza las capas y modelos ya existentes.

| Capa / responsabilidad | Implementación relevante |
| --- | --- |
| Aplicación: caso de uso | `src/modules/selection-process/application/list-selection-processes-for-me.ts` |
| Aplicación: filtros de búsqueda | `src/modules/selection-process/application/selection-process-search-filters.ts` |
| Infraestructura: consultas y ordenación | `src/modules/selection-process/infrastructure/prisma/prisma-selection-process-query-repository.ts` |
| Composition Root | `src/composition/selection-process.ts` |
| Presentación: página personalizada | `src/app/para-mi/page.tsx` |
| Presentación: seguimiento desde la tarjeta | `src/app/para-mi/actions.ts` |
| Presentación: carga y errores | `src/app/para-mi/loading.tsx` y `src/app/para-mi/error.tsx` |
| Navegación principal | `src/components/layout/app-sidebar.tsx` |
| Navegación desde el detalle | `src/app/convocatorias/[id]/page.tsx` |
| Pruebas de caso de uso | `src/modules/selection-process/application/list-selection-processes-for-me.test.ts` |

**Dependencias reutilizadas:** casos de uso de preferencias territoriales y profesionales de SPEC-007, repositorios de convocatorias de SPEC-003/004, sesión Better Auth y casos de uso de seguimiento de SPEC-006.

### 5.1. Flujo simplificado

```text
Usuario autenticado → /para-mi
                     ↓
        ListSelectionProcessesForMe
                     ↓
   Leer preferencias territoriales/profesionales
                     ↓
   Construir filtros (estados 2/3 + AND/OR)
                     ↓
   Repositorio Prisma/PostgreSQL
   Filtrar → ordenar por plazos → paginar
                     ↓
   Mostrar tarjetas y estado de seguimiento
                     ↓
   Seguir convocatoria / Ver detalle / Mi seguimiento
```

### 5.2. Compatibilidad con otras SPEC

- **SPEC-004:** se conservan las funcionalidades del buscador general. Las extensiones de filtros y la ordenación específica de «Para mí» se activan solo cuando se solicitan.
- **SPEC-005:** se admite el retorno seguro desde el detalle al origen y página correspondientes.
- **SPEC-006:** se reutiliza el seguimiento personal existente; además se igualó la altura de las tarjetas de «Mis convocatorias» como mejora transversal.
- **SPEC-007:** se utilizan sus preferencias y se corrigió el buscador territorial para que busque por nombre de municipio y no mezcle comarca/provincia en la coincidencia de texto.

## 6. Correcciones y decisiones durante el desarrollo

| Tema | Decisión o solución final |
| --- | --- |
| Orden incorrecto por estado CIDO | Sustituido por prioridad basada en las fechas de solicitud |
| Filtros territoriales múltiples | Combinación OR dentro de provincias/comarcas/municipios; consulta anterior a paginación |
| Filtros profesionales | AND entre categorías configuradas y OR entre sus opciones |
| Regreso desde detalle | Conservación segura de `returnTo` y página de origen |
| Tarjetas desalineadas | Altura uniforme por fila, acciones inferiores alineadas |
| Enlace «Mi seguimiento» poco visible | Conversión en botón visual con icono |
| Badge de seguimiento redundante | Sustituido por fondo/borde azul muy sutil |
| Búsqueda de municipios de «Mi perfil» | Filtrado por nombre normalizado, evitando coincidencias masivas por provincia/comarca |

## 7. Validación y pruebas

La validación se ha efectuado por bloques, con comprobaciones funcionales comunicadas por el usuario.

### 7.1. Pruebas funcionales verificadas

- [x] Listado de convocatorias de los estados CIDO previstos.
- [x] Ordenación por fechas: abiertas, futuras, desconocidas y finalizadas.
- [x] Selección territorial y combinación de territorios.
- [x] Preferencias profesionales de plazas/bolsas, materias y grupos de titulación.
- [x] Combinación AND entre grupos y OR dentro de cada grupo.
- [x] Seguimiento de convocatorias desde «Para mí».
- [x] Navegación al detalle y regreso a «Para mí» en la página correspondiente.
- [x] Estado sin preferencias configuradas.
- [x] Estado sin coincidencias.
- [x] Paginación y casos de página solicitada fuera de rango.
- [x] Comportamiento para usuario no autenticado.
- [x] Altura uniforme y acciones alineadas en las tarjetas de «Para mí».
- [x] Botón «Mi seguimiento» destacado.
- [x] Fondo diferenciado en las convocatorias seguidas.
- [x] Altura uniforme de las tarjetas de «Mis convocatorias».
- [x] Búsqueda de municipios de las preferencias territoriales corregida y validada.

### 7.2. Validación técnica final

Comandos comunicados como **correctos por el usuario** en el PASO 6.16.7.1:

```bash
pnpm exec tsc --noEmit
pnpm exec vitest run
pnpm build
```

El caso de uso de «Para mí» cuenta con pruebas automatizadas en `list-selection-processes-for-me.test.ts` (10 casos durante el desarrollo).

**Alcance de la afirmación de validación:** los comandos y pruebas de integración en la aplicación fueron ejecutados y confirmados por el usuario; este documento no representa una ejecución independiente posterior al cierre.

## 8. Limitaciones conocidas y fuera de alcance

- Las coincidencias dependen de la información sincronizada desde CIDO y de las preferencias guardadas.
- La ubicación del organismo no identifica necesariamente el lugar de trabajo.
- «Para mí» no comprueba automáticamente si el usuario cumple todos los requisitos legales o académicos de una convocatoria.
- Los motivos visibles de coincidencia representan criterios generales activos, no una explicación individual detallada de todos los datos de cada convocatoria.
- No se amplía el ámbito geográfico fuera de Catalunya en esta SPEC.
- No se implementan alertas periódicas, avisos automáticos ni nuevas funciones de dashboard.
- No se modifica el catálogo de preferencias de SPEC-007 ni se incorpora jornada laboral.

## 9. Criterios de aceptación y cierre

La especificación se considera completada porque:

1. Existe una ruta personalizada y accesible desde el menú lateral.
2. La página usa las preferencias territoriales y profesionales persistidas del usuario.
3. La selección aplica las reglas acordadas y ordena resultados por los plazos de solicitud.
4. La paginación es consistente y trabaja con los resultados filtrados y ordenados.
5. Se pueden consultar fuentes oficiales, abrir detalles y seguir convocatorias.
6. Los estados vacíos, errores y autenticación están contemplados.
7. El diseño final de ambas pantallas de tarjetas ha sido revisado y validado.
8. TypeScript, Vitest y la compilación de producción han sido reportados sin errores.
9. El usuario confirma que no quedan nuevas mejoras o incidencias pendientes de esta SPEC.

**Resultado final: SPEC-008 — FINALIZADA Y VALIDADA (18/10/2026).**

---

## 10. Próximo paso

Iniciar, en una conversación o fase diferenciada, **SPEC-009 — Dashboard del opositor**. Primero se acordará su alcance y diseño funcional, sin comenzar por cambios de código ni alterar las especificaciones cerradas.
