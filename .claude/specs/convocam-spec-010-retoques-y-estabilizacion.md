# SPEC-010 - Retoques y estabilización de Convoca'm

> **Estado:** CERRADA - implementación y validaciones funcionales y técnicas completadas.  
> **Versión del documento:** 1.0 (consolidada).  
> **Fecha de cierre:** 23/10/2026.  
> **Proyecto:** Convoca'm - Portal personal del opositor en Catalunya (TFM).  
> **Alcance territorial:** Catalunya; fuente oficial principal CIDO (Diputació de Barcelona).  
> **Dependencias:** SPEC-001 a SPEC-009.

---

## 1. Resumen ejecutivo

SPEC-010 agrupa las mejoras de interfaz, cartografía, navegación, filtros y estabilización realizadas una vez implementadas las funcionalidades centrales de Convoca'm. **No sustituye** las especificaciones funcionales anteriores: las complementa y mejora su presentación e integración.

Se han completado:

1. Simplificación de la página de inicio, con buscador y tres convocatorias recientes con inscripción abierta.
2. Rediseño de **Mis convocatorias**, con listado y mapa en una distribución 65 % / 35 %.
3. Franja horizontal con los **ocho estados personales** y filtrado múltiple.
4. Incorporación del mapa compartido a **Para mí**, conservando las recomendaciones del perfil.
5. Exclusión de las convocatorias ya seguidas de **Para mí**, incluidos contador, paginación y mapa.
6. Vista **Listado / Mapa** en **Buscar convocatorias**, con criterios compartidos.
7. Mapa interactivo con cartografía del ICGC y MapLibre GL JS, agrupación de marcadores, ampliación, controles y filtros territoriales.
8. Indicadores superiores de estados en el **Dashboard** y enlace desde **Plazos próximos** hacia un listado realmente filtrado.
9. Correcciones de integración y del build de producción, incluida la página de login.
10. Validaciones funcionales **VF-01 a VF-06** y técnicas **VT-01 a VT-03**.

**Resultado:** versión funcional estable según las pruebas comunicadas por el usuario, sin nuevas funcionalidades pendientes dentro de SPEC-010. La entrega del TFM y una eventual puesta en producción constituyen fases posteriores.

## 2. Objetivos y criterios de diseño

- Mejorar el acceso visual y territorial a las convocatorias sin modificar sus datos oficiales.
- Reutilizar componentes, consultas y casos de uso existentes; evitar duplicación de reglas de negocio.
- Mantener **Clean Architecture**: dominio, aplicación, infraestructura/adaptadores y composición.
- Mantener la navegación por URL, incluidos filtros, paginación y retorno desde detalle cuando corresponda.
- Conservar las diferencias entre el **estado oficial CIDO** y el **estado personal** del opositor.
- Mostrar contadores coherentes con el universo real de la consulta, no con las tarjetas visibles en una única página.
- Ofrecer una interfaz en **castellano**, responsive y usable sin sesión cuando la función sea pública.
- Avanzar con cambios pequeños, un archivo por paso y validación del usuario antes de continuar.

### 2.1. Restricciones mantenidas

- **CIDO** sigue siendo la fuente de convocatorias de Catalunya.
- La búsqueda general continúa siendo pública; el seguimiento y las recomendaciones personalizadas requieren autenticación.
- No se cambia el conjunto de ocho estados personales de SPEC-006.
- No se modifican las preferencias territoriales y profesionales aprobadas en SPEC-007.
- No se desarrolla en SPEC-010 la ampliación a toda España ni el análisis de bases por IA (ideas futuras).
- No se introducen nuevas tablas ni migraciones específicas para la visualización cartográfica descrita aquí.

---

## 3. Funcionalidades implementadas

### 010.1. Inicio público (`/`)

**Decisión:** mantener una portada sencilla y orientada a la búsqueda, sin convertirla en un segundo Dashboard.

**Comportamiento aprobado e implementado:**

- Buscador principal que envía la consulta a `/convocatorias`.
- Accesos a búsquedas frecuentes.
- Sección **Últimas convocatorias abiertas**: hasta **tres tarjetas en una fila**, con datos reales.
- La consulta reutiliza `ListActiveSelectionProcesses`, con `statusId: [3]`, `applicationPeriod: "open"`, `sort: "publication-desc"` y `pageSize: 3`.
- Si no hay procesos con inscripción abierta, se muestra un estado vacío con acceso al buscador.
- Cabecera adaptada a usuario autenticado o visitante.

**Resultado:** diseño sencillo validado por el usuario. No se añaden más bloques a la portada.

### 010.2. Mis convocatorias: listado + mapa (`/mis-convocatorias`)

**Disposición:**

- Escritorio ancho: **65 % listado / 35 % mapa** (`13fr / 7fr`).
- **Una tarjeta por fila**, no dos o más columnas de tarjetas.
- Anchuras medianas y móviles: los bloques se apilan, con el mapa por debajo del listado.
- Se mantiene la información de las tarjetas definida en SPEC-006: título, municipio y comarca, plaza/bolsa, estado oficial, plazo, jornada, reservas, último documento y datos del seguimiento cuando existan.
- Se conservan las acciones **Ver detalle**, **Dejar de seguir** y acceso a fuente oficial, además del selector de estado personal.

**Mapa:**

- Marcadores por municipio para los procesos que sigue la persona autenticada.
- Contador por municipio y descripción contextual.
- Clic en un marcador para aplicar filtro de municipio; se puede quitar el filtro o cambiar de municipio.
- Se conservan los filtros personales al alternar municipios dentro del flujo ordinario.
- En el estado sin seguimientos se muestra el mensaje de invitación a buscar convocatorias.

### 010.3. Indicadores de los ocho estados personales

Se integra la franja **Mis estados personales**, reutilizando un componente de presentación con `layout="horizontal"`.

Los estados, en el orden definido por el dominio, son:

| Código interno | Etiqueta visible |
|---|---|
| `INTERESTED` | Me interesa |
| `PREPARING_APPLICATION` | Preparando solicitud |
| `APPLICATION_SUBMITTED` | Solicitud presentada |
| `ADMITTED` | Admitido |
| `EXCLUDED` | Excluido |
| `EXAM_PENDING` | Examen pendiente |
| `EXAM_COMPLETED` | Examen realizado |
| `COMPLETED` | Finalizado |

**Reglas:**

- Cada indicador incorpora icono, nombre y número de seguimientos.
- Permite **multiselección**: OR entre estados seleccionados.
- Cuando también hay un municipio activo, los filtros se combinan (AND entre estado y municipio).
- Listado y mapa reaccionan conjuntamente a los estados seleccionados.
- Los indicadores se pueden deseleccionar y existe la acción **Limpiar estados**.
- Los estados se codifican en la URL mediante parámetros repetidos `personalStatus`.
- En `Mis convocatorias`, los contadores de la franja se calculan a partir de los seguimientos y pueden reflejar el municipio elegido, sin ocultar las otras opciones por el estado seleccionado.

**Ubicaciones finales:**

- `Mis convocatorias`: franja en la cabecera, antes del listado y del mapa.
- `Dashboard` autenticado: **primer bloque del contenido**, por encima del saludo y de las tarjetas de resumen. Sus enlaces abren `Mis convocatorias` con el estado correspondiente seleccionado.

### 010.4. Para mí: distribución y mapa (`/para-mi`)

- Se adopta igualmente la distribución **65 % tarjetas / 35 % mapa** en escritorio ancho; apilado en pantallas pequeñas.
- El mapa reutiliza el componente compartido utilizado por `Mis convocatorias`.
- Un marcador indica cuántas oportunidades compatibles hay en cada municipio.
- Clic en el municipio filtra las tarjetas; el mapa conserva los demás municipios compatibles para permitir cambiar el filtro.
- La paginación del listado continúa siendo de **10 convocatorias por página** por defecto.
- Se mantienen el orden por prioridad de plazo y los motivos de coincidencia verificables.
- La lógica de compatibilidad corresponde a SPEC-008: estados oficiales CIDO **2 (pendiente de plazo)** y **3 (plazo abierto)**; alternativas OR dentro de cada grupo de preferencias y AND entre grupos configurados.
- La coincidencia territorial usa la **ubicación del organismo convocante**, que no implica necesariamente el lugar del puesto.
- Se conservan los estados de pantalla sin preferencias, sin recomendaciones y sin recomendaciones para el municipio seleccionado.

### 010.5. Para mí: exclusión de convocatorias seguidas

**Decisión final:** una convocatoria ya seguida **no debe aparecer** en `Para mí`; no basta con cambiar el color de fondo de su tarjeta.

**Regla de aplicación:**

1. Al cargar recomendaciones se llama a `ListSelectionProcessesForMe` con `excludeFollowed: true`.
2. En la consulta de Prisma se aplica `excludeFollowedByUserId` mediante la ausencia de un seguimiento del usuario (`userSelectionProcesses: { none: { userId } }`).
3. La exclusión sucede **antes del total, la paginación y la consulta de puntos del mapa**.
4. Tras seguir una convocatoria, esta deja de aparecer en las recomendaciones; el contador disminuye y los marcadores se recalculan.
5. Una página que quede fuera de rango por la reducción de resultados se ajusta a la última disponible.
6. La convocatoria permanece accesible en `Mis convocatorias`; no se borra ningún seguimiento.

**Resultado:** el Dashboard y `Para mí` comparten el mismo concepto de **oportunidades nuevas no seguidas**.

### 010.6. Cartografía y mapa interactivo compartido

**Motor visual adoptado:** MapLibre GL JS con el estilo oficial **mapa base simplificado del ICGC**. La implementación reutiliza una pieza visual común (`IcgcMunicipalitiesMap`) en los distintos contextos.

**Interacciones incluidas:**

- Movimiento por el mapa y zoom.
- Botón para centrar/restablecer la vista general de Catalunya.
- Centrado automático al elegir un municipio, cuando hay coordenadas válidas.
- Marcadores con cantidad de convocatorias, tooltip contextual y enlace interno.
- **Agrupación visual de marcadores cercanos** cuando se superponen en pantalla: el grupo indica el total y permite acercarse para desagruparlos. Al acercamiento máximo, la interfaz conserva una forma de elegir el municipio individual.
- Opción **Ampliar mapa**, con vista en diálogo y cierre sin perder el mapa original.
- Uso en escritorio y en móvil, con tratamiento de carga y posibles errores cartográficos.

**Decisiones cartográficas:**

- Se toma como referencia la información geográfica asociada al organismo convocante en CIDO.
- Si faltan coordenadas válidas, no se inventa la ubicación; la convocatoria sigue estando disponible en el listado.
- Se descartó superponer delimitaciones **municipales** en el diseño final, por su resultado visual. Durante la evolución del mapa se incorporó la capa comarcal a la alternativa SVG.
- Se conserva de forma temporal el renderizador SVG anterior como alternativa de reversión mediante `USE_ICGC_MAP`, activado actualmente a `true`.
- No se representa una ubicación exacta del puesto de trabajo si los datos solo identifican el municipio del organismo.

**Infraestructura MapLibre:**

- Recursos de worker/archivo compartido sincronizados en `public/maplibre/` mediante `scripts/sync-maplibre-assets.mjs`.
- Ejecución de esa sincronización mediante el script `postinstall` del proyecto.
- El componente visual recibe marcadores y enlaces preparados por la capa servidora; no consulta la base de datos ni aplica directamente reglas de seguimiento.

### 010.7. Buscar convocatorias: vista Listado / Mapa (`/convocatorias`)

**Decisión:** ofrecer dos vistas alternativas para el **mismo conjunto filtrado** de procesos, sin duplicar el buscador ni modificar las reglas de SPEC-004.

**Comportamiento:**

- **Listado**, por defecto, y **Mapa**, activado con `view=map`.
- Conmutador en la cabecera de resultados; ambos enlaces conservan los criterios de búsqueda en la URL.
- Misma búsqueda por texto, estados oficiales, filtros profesionales, temporales y territoriales.
- El listado permanece paginado; en la implementación del buscador se utilizan **20 resultados por página**.
- **Los puntos y contadores del mapa incluyen todas las convocatorias que cumplen los filtros**, no solo las 20 tarjetas de la página actual.
- El mapa recibe municipios agregados por provincia/municipio con su número de coincidencias.
- Clic en un municipio para filtrar la búsqueda; el resto de condiciones se mantiene.
- Agrupación de marcadores con solapamiento, zoom, tooltip, ampliación y centrado.
- Sin coincidencias: mensaje vacío y mapa sin marcadores, sin errores.
- Si hay convocatorias sin coordenadas representables, se informa de la diferencia entre coincidencias totales y representables sin excluirlas del listado.
- El detalle mantiene un enlace de regreso con los parámetros del buscador.

**Criterio técnico decisivo:** `findActive(...)` y `listMunicipalityMapPoints(...)` utilizan **la misma construcción de filtros**. La consulta de puntos agrega en PostgreSQL/Prisma por institución y después consolida por municipio y provincia; no se cargan todas las convocatorias individualmente para pintar el mapa.

### 010.8. Dashboard: estados superiores y plazos enlazados (`/dashboard`)

Esta SPEC **no reemplaza** el Dashboard definido por SPEC-009. Sobre su diseño aprobado se introducen dos mejoras:

**a) Franja superior de estados personales**

- Solo para usuarios autenticados.
- Ocupa todo el ancho disponible en la parte superior del contenido, antes del saludo.
- Reutiliza `PersonalSelectionProcessStatusIndicators` y los datos de seguimiento reales del usuario.
- Pulsar un estado lleva a `Mis convocatorias` con `personalStatus` aplicado; los contadores no se inventan ni se calculan a partir de las cinco tarjetas de plazos.

**b) Enlace de Plazos próximos a un filtro real**

- La tarjeta del resumen **Plazos próximos** enlaza a `/mis-convocatorias?upcomingDeadlines=1`.
- Esa vista muestra solo seguimientos con estado **`INTERESTED` o `PREPARING_APPLICATION`** cuyo plazo termina **desde hoy hasta dentro de 15 días naturales, ambos inclusive**.
- Las tarjetas se ordenan por vencimiento ascendente (primero las más urgentes).
- Se aplica el criterio al listado y a los datos suministrados al mapa.
- Se presenta un resumen visible del filtro y la acción **Quitar filtro de plazos**.
- Se conserva el retorno a esta vista filtrada desde el detalle mediante `returnTo`.
- El acceso ordinario a `Mis convocatorias` no queda limitado a esos quince días.
- El panel de plazos del Dashboard sigue mostrando como máximo **cinco** vencimientos, mientras que el contador y la vista filtrada pueden abarcar todos los que cumplan el criterio.

El Dashboard conserva sus restantes bloques: resumen del opositor, plazos, oportunidades nuevas para el perfil y últimas publicaciones oficiales.

### 010.9. Correcciones de integración y de producción

En el transcurso de la estabilización se corrigieron problemas de exportación y tipado detectados durante las iteraciones, entre ellos los relacionados con el `default export` de `Mis convocatorias`, el selector de estado personal (TS2305) y el tipo `institution` en pruebas.

**Incidencia identificada en VT-03:**

- `next build` compilaba TypeScript, pero fallaba al prerenderizar `/login` con `useSearchParams() should be wrapped in a suspense boundary`.
- Se añadió un límite `Suspense` alrededor de `LoginForm` dentro de `src/app/login/page.tsx`, con texto de carga.
- Se mantuvieron el diseño, Better Auth y la navegación de login.
- Después del cambio, el usuario confirmó que **`pnpm build` funcionaba correctamente**.

---

## 4. Parámetros de URL y navegación

| Pantalla | Parámetro | Comportamiento |
|---|---|---|
| `/convocatorias` | `view=map` | Activa la vista geográfica; ausencia del parámetro = listado. |
| `/convocatorias` | Filtros de SPEC-004, p. ej. `q`, `statusId`, `province`, `county`, `municipality` | La vista y los filtros se conservan al alternar Listado / Mapa. |
| `/mis-convocatorias` | `personalStatus=...` repetido | Permite seleccionar uno o varios estados personales. |
| `/mis-convocatorias` | `municipality=...` y `province=...` | Acota las tarjetas al municipio elegido. |
| `/mis-convocatorias` | `upcomingDeadlines=1` | Activa el criterio de 15 días y dos estados personales. |
| `/para-mi` | `page=...` | Paginación de recomendaciones no seguidas. |
| `/para-mi` | `municipality=...` y opcionalmente `province=...` | Filtra las tarjetas de recomendaciones de ese municipio. |
| `/convocatorias/[id]` | `returnTo=...` | Recupera la vista de procedencia cuando se generó el enlace. |

**Reglas transversales:**

- Los filtros visibles y la URL constituyen la referencia de navegación; no deben depender exclusivamente de estado local efímero.
- El filtro de municipio del mapa no debe cambiar las preferencias guardadas en el perfil.
- Los resultados de un usuario no deben mezclarse con los seguimientos de otro.
- El acceso al listado público no obliga a iniciar sesión.

## 5. Diseño técnico y trazabilidad

### 5.1. Tecnologías empleadas

- **Aplicación:** Next.js 16.3.5, React 19, TypeScript y Tailwind CSS.
- **Persistencia:** PostgreSQL + Prisma ORM.
- **Autenticación:** Better Auth.
- **Mapas:** MapLibre GL JS 6.x y servicios cartográficos del ICGC.
- **Pruebas:** Vitest, TypeScript, ESLint y `next build`.

### 5.2. Archivos y responsabilidades principales

> Rutas relativas a la raíz de `convocam-app`. La lista identifica las piezas principales, no pretende ser un inventario exhaustivo de cada archivo editado durante el desarrollo.

| Capa / responsabilidad | Archivo principal |
|---|---|
| Inicio público | `src/app/page.tsx` |
| Dashboard personalizado y público | `src/app/dashboard/page.tsx` |
| Listado y mapa del buscador | `src/app/convocatorias/page.tsx` |
| Seguimientos, estados, mapa y filtro de plazos | `src/app/mis-convocatorias/page.tsx` |
| Recomendaciones no seguidas + mapa | `src/app/para-mi/page.tsx` |
| Corrección de compilación del login | `src/app/login/page.tsx` |
| Franja de ocho estados | `src/modules/user-selection-process/presentation/personal-selection-process-status-indicators.tsx` |
| Catálogo visual de estados | `src/modules/user-selection-process/presentation/personal-selection-process-status-options.ts` |
| Mapa reutilizado por Mis convocatorias / Para mí | `src/modules/user-selection-process/presentation/followed-municipalities-map.tsx` |
| Mapa MapLibre / ICGC | `src/modules/user-selection-process/presentation/icgc-municipalities-map.tsx` |
| Conmutador Listado / Mapa del buscador | `src/modules/selection-process/presentation/selection-process-results-view-toggle.tsx` |
| Caso de uso de puntos agregados del mapa | `src/modules/selection-process/application/list-selection-process-municipality-map-points.ts` |
| Caso de uso de recomendaciones para el perfil | `src/modules/selection-process/application/list-selection-processes-for-me.ts` |
| Consultas con filtros compartidos y agregación de municipios | `src/modules/selection-process/infrastructure/prisma/prisma-selection-process-query-repository.ts` |
| Composición de dependencias de convocatorias | `src/composition/selection-process.ts` |
| Recursos locales de MapLibre | `scripts/sync-maplibre-assets.mjs` |

### 5.3. Flujo de datos resumido

**Buscador:** formulario/URL -> filtros interpretados en el servidor -> caso de uso de búsqueda -> repositorio Prisma -> tarjetas paginadas y, si se solicita la vista Mapa, municipios agregados sin paginar -> componente de mapa.

**Para mí:** sesión y preferencias -> `ListSelectionProcessesForMe` -> filtros territoriales/profesionales + exclusión de seguidas -> listado paginado y puntos agregados -> tarjetas, contador y mapa.

**Mis convocatorias:** sesión -> caso de uso de seguimientos del usuario -> filtros de estado, municipio y/o vencimiento en la página -> indicadores, tarjetas y puntos del mapa.

**Dashboard:** casos de uso de SPEC-009 + lista de seguimientos -> contadores y bloques visuales; enlaces parametrizados hacia las pantallas especializadas.

### 5.4. Propiedades de arquitectura preservadas

- Reutilización de la lógica de filtrado y de los repositorios: el mapa no mantiene criterios propios divergentes.
- El componente cartográfico es de **presentación**: recibe datos ya agrupados y URL calculadas.
- No se altera el dominio de los estados personales ni la sincronización con CIDO.
- La exclusión de seguidas en `Para mí` se ejecuta en la consulta, **antes de paginar**, no ocultando tarjetas después.
- Las consultas de datos privados reciben el identificador de usuario autenticado.

---

## 6. Matriz de validación funcional

Las validaciones siguientes fueron **ejecutadas y confirmadas por el usuario** en su entorno local, a lo largo del trabajo de SPEC-010.

| ID | Prueba | Resultado |
|---|---|---|
| **VF-01** | Alternancia Listado / Mapa, recarga y permanencia de la vista. | **SUPERADA** |
| **VF-02** | Filtros coherentes entre Listado y Mapa. | **SUPERADA** |
| **VF-03** | Contadores, resultados totales y paginación. | **SUPERADA** |
| **VF-04** | Marcadores por municipio, agrupación, zoom, vista ampliada y clic para filtrar. | **SUPERADA** |
| **VF-05** | Navegación al detalle y regreso; historial y persistencia de parámetros. | **SUPERADA** |
| **VF-06** | Casos especiales, responsive y acceso público. | **SUPERADA** |

### 6.1. Detalle de VF-06

1. **Sin resultados:** búsqueda sin coincidencias, comprobación de listado vacío, mapa sin marcadores y recuperación con Limpiar.
2. **Móvil:** comprobación de tarjetas, filtros, alternancia Listado / Mapa y ausencia de cortes o desplazamiento horizontal indeseado.
3. **Mapa ampliado:** apertura, zoom, movimiento, interacción con marcadores, cierre y recuperación en escritorio y móvil.
4. **Acceso público y regresión:** buscador utilizable sin iniciar sesión; comprobación de los mapas privados y de que `Para mí` no presenta convocatorias ya seguidas.

**Acta de aceptación:** el usuario confirmó expresamente el **23/10/2026** que las cuatro partes de VF-06 funcionaban correctamente, cerrando la validación funcional **6/6**.

## 7. Matriz de validación técnica

| ID | Comprobación | Comando | Resultado comunicado |
|---|---|---|---|
| **VT-00** | ESLint | `pnpm lint` | **CORRECTA**; errores solucionados por el usuario. |
| **VT-01** | Comprobación de tipos | `pnpm exec tsc --noEmit` | **SUPERADA**. |
| **VT-02** | Pruebas automáticas | `pnpm exec vitest run` | **SUPERADA**. |
| **VT-03** | Compilación optimizada | `pnpm build` | **SUPERADA** tras corregir `/login`. |

**Observaciones de VT-03:** la primera compilación superó el paso de TypeScript, pero la prerenderización de `/login` detectó la ausencia de un límite `Suspense` para el uso de `useSearchParams()`. Tras aplicar la corrección en `src/app/login/page.tsx`, el usuario confirmó una ejecución satisfactoria del build.

Los resultados son **confirmaciones de ejecución local**; el cierre de SPEC-010 no presupone pruebas en un despliegue de producción, pruebas de carga o auditoría de seguridad independientes. No se documenta una cifra concreta de pruebas Vitest, al no haberse aportado en este cierre el desglose final de casos ejecutados.

---

## 8. Decisiones expresas y exclusiones

| Decisión | Resultado |
|---|---|
| Mantener la portada sencilla | Sin ampliar la home a un dashboard alternativo. |
| Tarjetas de Mis convocatorias | Una por fila; 65 % listado / 35 % mapa en escritorio. |
| Mapa compartido | Reutilización en Mis convocatorias y Para mí. |
| Superposición municipal | **Descartada** por mala apariencia visual. |
| Recomendaciones seguidas | **Excluidas**, no solo diferenciadas con otro color. |
| Conteos en el mapa del buscador | Sobre **todos** los resultados filtrados, no la página actual. |
| Estados personales | Ocho estados existentes, sin añadir otros. |
| Plazos próximos | Ventana inclusiva hoy + 15 días y dos estados personales definidos. |
| Nuevas funciones ajenas a SPEC-010 | No incorporar IA para PDFs ni expansión geográfica. |

## 9. Observaciones y acciones diferidas

### 9.1. Modo temporal de publicaciones oficiales (obligatorio antes de producción)

En el Dashboard **se mantiene intencionadamente** `TEST_RECENT_PUBLICATIONS = true`, tal como se aprobó al cerrar SPEC-009.

- **Situación actual:** muestra hasta cinco documentos oficiales activos de los **últimos dos meses** de convocatorias que el usuario sigue, aunque el documento se publicara antes de iniciar su seguimiento.
- **Comportamiento definitivo aprobado para producción:** documentos con fecha de publicación **igual o posterior al día de inicio del seguimiento**, incluido el mismo día, según el caso de uso de SPEC-009.
- **Acción posterior:** desactivar el modo de prueba, restituir y verificar el criterio definitivo antes de publicar Convoca'm para usuarios reales.
- **Decisión de cierre:** no modificarlo en SPEC-010 para no invalidar la validación actual ni contradecir la instrucción expresa del usuario.

### 9.2. Observación de navegación detectada en revisión estática

El filtro `upcomingDeadlines=1` se conserva en los enlaces de detalle y se aplica correctamente al listado y a los datos del mapa en `Mis convocatorias`. Sin embargo, el constructor de enlaces de **marcadores del mapa compartido** conserva los estados personales, pero **no incorpora explícitamente `upcomingDeadlines=1`** al cambiar de municipio. Por ello, al pulsar un marcador desde esta vista especial **podría desactivarse el filtro de plazos** tras navegar. Este cruce concreto no consta como prueba individual de aceptación. Se registra como observación para una revisión posterior, sin modificar el código ni revocar las validaciones expresamente confirmadas.

### 9.3. Otros trabajos fuera de alcance

- Documentación general y memoria académica del TFM.
- Preparación final del repositorio, instrucciones de despliegue y demostración.
- Despliegue productivo y pruebas de operación en el entorno elegido.
- Ideas futuras: ampliación de cobertura a toda España y análisis de bases oficiales con IA.

---

## 10. Criterios de cierre y conclusión

| Criterio | Estado |
|---|---|
| Mejoras funcionales aprobadas implementadas | **CUMPLIDO** |
| Inicio, Dashboard, Para mí, Mis convocatorias y buscador integrados | **CUMPLIDO** |
| Mapa ICGC/MapLibre y consultas geográficas compartidas | **CUMPLIDO** |
| VF-01 a VF-06 | **6/6 SUPERADAS** |
| TypeScript, Vitest, ESLint y build | **SUPERADOS** según confirmación del usuario |
| Incidencia `/login` en producción corregida | **CUMPLIDO** |
| Archivo SPEC-010 definitivo | **GENERADO** |

**Conclusión:** se cierra **SPEC-010 - Retoques y estabilización** como una fase implementada y validada en el entorno de desarrollo. El producto mantiene su enfoque de portal personal de oposiciones en Catalunya con datos de CIDO y conserva una arquitectura reutilizable para una evolución posterior. La siguiente etapa del TFM consiste en consolidar la documentación restante y preparar la entrega, no en introducir más funcionalidades por defecto.

---

**Fin de SPEC-010.**
