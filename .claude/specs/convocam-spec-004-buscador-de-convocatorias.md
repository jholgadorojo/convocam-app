# SPEC-004 — Buscador de convocatorias

**Proyecto:** Convoca'm  
**Estado:** ✅ Cerrada  
**Versión actualizada:** 2026-10-07  
**Fuente principal de datos:** CIDO — Diputació de Barcelona  

---

## 1. Objetivo

Construir el buscador real de convocatorias de Convoca'm sobre los datos sincronizados desde CIDO y almacenados en PostgreSQL.

El buscador debe permitir a cualquier persona, autenticada o no, localizar procesos selectivos y bolsas de trabajo de acceso libre en Catalunya mediante búsqueda textual, filtros, territorio, fechas y ordenación, manteniendo una experiencia comprensible para una persona opositora.

El buscador forma parte del acceso público de Convoca'm. El inicio de sesión no es obligatorio para consultar convocatorias; será necesario únicamente para funcionalidades personales como seguir una convocatoria.

---

## 2. Principios funcionales

1. Los datos mostrados proceden de PostgreSQL, previamente sincronizados desde CIDO.
2. Solo se muestran por defecto convocatorias activas en origen mediante `sourceActive = true`.
3. El buscador no depende de llamadas directas a CIDO durante la navegación normal.
4. Los textos visibles de la interfaz están en castellano.
5. Los nombres técnicos del código pueden mantenerse en inglés.
6. La implementación respeta la arquitectura Clean Architecture del proyecto.
7. Los datos oficiales y los estados calculados por Convoca'm deben distinguirse visualmente.
8. Los filtros deben mantenerse al paginar, ordenar, entrar en el detalle y volver al listado.

---

## 3. Arquitectura

El buscador se mantiene separado por capas.

### Application

Contratos y modelos de aplicación relacionados con:

- filtros de búsqueda;
- ordenación;
- paginación;
- opciones disponibles para los filtros;
- DTO/list item de convocatoria;
- repositorio de consulta;
- casos de uso de listado y obtención de filtros.

### Infrastructure

La implementación Prisma es responsable de:

- consultar PostgreSQL;
- construir las condiciones de filtrado;
- realizar la búsqueda textual tolerante;
- aplicar la ordenación;
- calcular los resultados territoriales por radio;
- paginar;
- devolver las opciones reales disponibles para los filtros.

Implementación principal:

```text
PrismaSelectionProcessQueryRepository
```

### Presentation / Next.js

La ruta principal es:

```text
/convocatorias
```

La URL representa el estado de búsqueda para permitir:

- recargar la página;
- compartir una búsqueda;
- conservar filtros al paginar;
- conservar filtros al entrar en el detalle;
- volver desde el detalle al mismo estado del listado.

---

## 4. Búsqueda textual

El buscador dispone de búsqueda libre por texto.

Ejemplos:

```text
informática
auxiliar administratiu
cardedeu
ajuntament granollers
```

La búsqueda no se limita a una igualdad exacta.

### 4.1. Búsqueda tolerante

Se utiliza PostgreSQL con:

```text
unaccent
pg_trgm
word_similarity
```

Esto permite tolerar:

- diferencias de acentos;
- pequeñas variaciones de escritura;
- coincidencias parciales;
- errores menores;
- palabras similares.

### 4.2. Términos múltiples

Cuando el usuario introduce varios términos, todos deben contribuir a localizar la convocatoria.

La búsqueda se diseñó para evitar que una consulta con varias palabras se convierta en una coincidencia excesivamente amplia.

### 4.3. Campos relevantes

La relevancia textual tiene en cuenta principalmente información como:

- título de la convocatoria;
- organismo;
- municipio;
- comarca;
- provincia;
- grupo de titulación.

---

## 5. Prioridad de resultados

Cuando existe búsqueda textual, Convoca'm utiliza una puntuación de relevancia.

La prioridad conceptual es:

```text
título
  ↓
organismo
  ↓
territorio
  ↓
otros campos de apoyo
```

Una coincidencia clara en el título debe aparecer antes que una coincidencia secundaria en ubicación o metadatos.

Si no hay texto de búsqueda, la ordenación por defecto no utiliza relevancia.

---

## 6. Ordenación

El buscador permite seleccionar explícitamente el orden de los resultados.

Opciones:

```text
Relevancia
Última publicación oficial
Plazo: finaliza antes
Plazo: finaliza después
Municipio: A → Z
```

Valores técnicos:

```text
relevance
publication-desc
deadline-asc
deadline-desc
municipality-asc
```

### Reglas por defecto

Con texto de búsqueda:

```text
Relevancia
```

Sin texto de búsqueda:

```text
Plazo: finaliza antes
```

Si el usuario selecciona una ordenación explícita, esta prevalece.

Una ordenación `relevance` sin texto se normaliza a la ordenación por finalización de plazo ascendente.

---

## 7. Filtros implementados

### 7.1. Tipo de convocatoria

```text
Plazas de plantilla
Bolsa de trabajo
```

Se basa en:

```text
isJobPool
```

Puede seleccionarse uno, ambos o ninguno.

---

### 7.2. Estado oficial CIDO

Etiqueta visible:

```text
Estado oficial CIDO
```

Se basa en:

```text
statusId
status
```

Este filtro representa exclusivamente el estado oficial recibido de CIDO.

No debe confundirse con el estado calculado del plazo de solicitudes.

---

### 7.3. Plazo de solicitud

Convoca'm calcula un estado funcional utilizando:

```text
applicationStartDate
applicationEndDate
```

Opciones:

```text
Todos los plazos
Abierto ahora
Próximo a abrir
Finalizado
Sin fechas disponibles
```

Valores técnicos:

```text
open
future
closed
unknown
```

Semántica:

#### Abierto ahora

```text
applicationStartDate <= hoy
AND
applicationEndDate >= hoy
```

Una convocatoria que finaliza hoy continúa considerándose abierta durante ese día.

#### Próximo a abrir

```text
applicationStartDate > hoy
```

#### Finalizado

```text
applicationEndDate < hoy
```

#### Sin fechas disponibles

No existen datos suficientes para clasificar con seguridad el plazo en una de las categorías anteriores.

La fecha de referencia se calcula respetando la fecha local aplicable a Catalunya y se compara como fecha, no como instante horario.

---

### 7.4. Ubicación

Filtros territoriales dependientes:

```text
Provincia
  ↓
Comarca
  ↓
Municipio
```

Los valores disponibles se obtienen de las instituciones vinculadas a las convocatorias activas.

No se utilizan listas territoriales ficticias o estáticas.

---

### 7.5. Radio desde municipio

Cuando existe un municipio seleccionado, puede utilizarse como origen para buscar convocatorias cercanas.

Opciones:

```text
Sin límite
5 km
10 km
25 km
50 km
100 km
```

### Comportamiento

Sin radio:

```text
provincia + comarca + municipio
```

funcionan como filtros territoriales exactos.

Con radio:

```text
municipio = origen de la búsqueda
```

El municipio deja de ser una restricción exacta sobre los resultados.

Los resultados pueden encontrarse en otra comarca o provincia si están dentro del radio solicitado.

### Cálculo

Se utiliza distancia aproximada en línea recta mediante la fórmula de Haversine.

No se utiliza:

- PostGIS;
- Google Maps API;
- servicios externos de rutas.

El punto de origen se obtiene a partir de las coordenadas disponibles de las instituciones del municipio seleccionado.

Si existen varias instituciones con coordenadas, se obtiene un punto representativo mediante la media de sus latitudes y longitudes.

Las instituciones del municipio de origen se conservan aunque alguna de ellas no disponga de coordenadas, siempre que el municipio pueda resolverse mediante otras instituciones.

Si no es posible resolver las coordenadas del municipio de origen, el sistema vuelve de forma segura al filtrado territorial exacto.

---

### 7.6. Grupo de titulación

Permite seleccionar uno o varios grupos.

Ejemplos:

```text
A1
A2
C1
C2
AP
```

La selección múltiple utiliza lógica OR entre los grupos seleccionados.

---

### 7.7. Ámbito

Se basa en:

```text
scopeId
scopeName
```

Las opciones proceden de las convocatorias activas almacenadas en PostgreSQL.

---

### 7.8. Sistema de selección

Se basa en:

```text
selectionSystemId
selectionSystem
```

Ejemplos posibles según los datos de CIDO:

```text
Oposición
Concurso-oposición
Concurso
```

---

### 7.9. Tipo de personal

Se basa en:

```text
personnelTypeId
personnelType
```

---

### 7.10. Fin del plazo de solicitud

La etiqueta visible se normaliza a:

```text
Fin del plazo de solicitud
```

Se filtra sobre:

```text
applicationEndDate
```

Se permiten dos límites:

```text
Desde
Hasta
```

Este filtro puede combinarse con `Plazo de solicitud`.

Ejemplo:

```text
Plazo de solicitud: Abierto ahora
Fin del plazo de solicitud: Hasta 31/10/2026
```

Significado:

> Convocatorias abiertas ahora cuyo plazo termina como máximo el 31 de octubre de 2026.

---

### 7.11. Reservas

Filtros disponibles:

```text
Personas con discapacidad
Personas desempleadas
Jóvenes
Mujeres
```

Campos:

```text
reservedDisabilityPositions
reservedUnemployed
reservedYoung
reservedWomen
```

---

## 8. Diferencia entre estado oficial y plazo calculado

Es posible que una convocatoria muestre simultáneamente información aparentemente contradictoria, por ejemplo:

```text
Oficial: Termini Obert
Solicitudes: Plazo finalizado
```

Esto no se considera necesariamente un error.

Son dos fuentes conceptualmente distintas:

```text
Estado oficial CIDO
        ↓
status / statusId

Estado calculado Convoca'm
        ↓
applicationStartDate / applicationEndDate
```

La interfaz los identifica explícitamente mediante los prefijos:

```text
Oficial:
Solicitudes:
```

Convoca'm no sustituye ni modifica el estado oficial recibido de CIDO.

---

## 9. Presentación de resultados

Cada resultado muestra información resumida suficiente para decidir si merece la pena abrir el detalle.

Entre otros datos:

- tipo de convocatoria;
- estado oficial;
- estado del plazo de solicitudes;
- título normalizado;
- organismo;
- ubicación;
- plazas;
- grupo;
- personal;
- sistema de selección;
- ámbito;
- fin del plazo de solicitud;
- reservas, cuando existen.

---

## 10. Normalización visual del título

Los títulos procedentes de CIDO pueden contener formatos poco adecuados para una interfaz moderna.

Convoca'm aplica una normalización únicamente de presentación.

El dato original almacenado no se modifica.

---

## 11. Presentación del número de plazas

El valor recibido de CIDO se conserva sin modificar en PostgreSQL.

La interfaz utiliza la siguiente regla:

```text
numberOfPositions > 0
    → mostrar el número

numberOfPositions = 0
    → Sin definir

numberOfPositions = null
    → Sin definir

Bolsa de trabajo
    → —
```

Esto evita que `0 plazas` sea interpretado erróneamente como una convocatoria sin plazas cuando en realidad el número no ha sido definido en la fuente.

La misma semántica debe utilizarse tanto en el buscador como en el detalle de convocatoria.

---

## 12. Paginación

Los resultados están paginados.

Tamaño utilizado:

```text
20 resultados por página
```

La paginación conserva todos los parámetros activos.

Ejemplo conceptual:

```text
/convocatorias?q=administrativo&province=Barcelona&page=2
```

Los enlaces `Anterior` y `Siguiente` no deben perder filtros ni ordenación.

---

## 13. Conservación del estado de búsqueda

Se utiliza un único formulario lógico para el buscador y los filtros.

Identificador:

```text
convocatorias-filter-form
```

El buscador superior puede enviar el mismo formulario mediante el atributo `form`.

Se utiliza una clave derivada del estado actual de filtros para mantener sincronizados los controles cuando cambia la URL.

Los parámetros deben conservarse en:

- nueva búsqueda;
- aplicación de filtros;
- ordenación;
- paginación;
- entrada en el detalle;
- retorno desde el detalle.

La acción `Limpiar` vuelve a:

```text
/convocatorias
```

---

## 14. Integración con SPEC-005

Cada resultado enlaza al detalle real de la convocatoria.

El enlace conserva una referencia al estado actual del buscador para que la acción de volver desde la ficha recupere los filtros y la página desde los que llegó el usuario.

SPEC-004 y SPEC-005 comparten por tanto la responsabilidad de preservar el contexto de navegación.

---

## 15. Casos especiales

### Sin resultados

Debe mostrarse un estado vacío comprensible:

```text
No se han encontrado convocatorias
Prueba con otros criterios de búsqueda.
```

### Valores no informados

La interfaz no debe convertir la ausencia de información en datos falsos.

Ejemplos:

```text
Plazas: Sin definir
Fecha no disponible
Grupo no especificado
```

según corresponda.

### Datos oficiales

Convoca'm puede calcular ayudas de presentación, pero los datos oficiales recibidos de CIDO deben conservarse sin reescribir su significado.

---

## 16. Pruebas

La SPEC incluye pruebas sobre los comportamientos relevantes del buscador.

Áreas prioritarias:

- filtrado por cada criterio;
- combinación de filtros;
- filtros territoriales dependientes;
- búsqueda textual tolerante;
- búsqueda sin acentos;
- múltiples términos;
- ranking de relevancia;
- paginación;
- conservación de filtros;
- estados de plazo;
- ordenaciones;
- comportamiento del radio territorial;
- casos sin resultados.

Los tests unitarios y de integración existentes forman parte del cierre de SPEC-004.

---

## 17. Decisiones de diseño relevantes

### PostgreSQL como fuente de consulta

La interfaz consulta la base local sincronizada y no CIDO directamente.

### Sin PostGIS en esta fase

El radio geográfico se resuelve con las coordenadas existentes y Haversine. Se evita introducir infraestructura adicional hasta que exista una necesidad real de escala o consultas geoespaciales más complejas.

### URLs como estado reproducible

Los filtros se expresan mediante query parameters, evitando depender exclusivamente de estado React local.

### Separación entre oficial y calculado

`statusId/status` representan CIDO; el plazo calculado representa una interpretación funcional de Convoca'm basada en fechas.

### No alterar datos de origen para mejorar la presentación

Ejemplos:

- normalización visual del título;
- `0 plazas` mostrado como `Sin definir`.

La transformación pertenece a presentación, no a persistencia.

---

## 18. Mejoras evaluadas y aplazadas a una segunda fase

Se ha decidido no ampliar más el buscador en esta fase.

Las siguientes mejoras quedan expresamente fuera del cierre actual y podrán analizarse posteriormente:

1. **Compatible con mi perfil**, cuando el perfil del opositor disponga de todos los datos necesarios.
2. **Área profesional / materia**, utilizando `SubjectArea` y `SelectionProcessSubjectArea`.
3. **Esfuerzo de preparación**, cuando exista enriquecimiento estructurado de bases y temarios.
4. **Accesos rápidos de vencimiento**, por ejemplo plazo termina hoy, en 3, 7, 14 o 30 días.
5. **Sin fase de méritos / solo oposición**, como filtro funcional simplificado.
6. **Nivel de catalán requerido**, cuando pueda tratarse con suficiente fiabilidad la diferencia entre acreditación previa y prueba lingüística.
7. **Con novedades recientes**, apoyándose en documentos y `lastDocumentPublicationDate`.
8. **Estabilidad del puesto**, mediante una clasificación de los tipos de personal y vínculo.

No se consideran prioritarios en esta planificación:

- número mínimo de plazas;
- tasa de examen;
- fecha de examen como filtro;
- jornada.

Ninguno de estos puntos forma parte de la Definition of Done de SPEC-004 v1.

---

## 19. Definition of Done

SPEC-004 se considera cerrada cuando:

- [x] `/convocatorias` consulta PostgreSQL real.
- [x] Solo se muestran convocatorias activas de la fuente.
- [x] Existe búsqueda textual tolerante.
- [x] La búsqueda ignora diferencias de acentos relevantes.
- [x] Se utiliza ranking de relevancia cuando existe texto.
- [x] Existen filtros reales obtenidos de PostgreSQL.
- [x] El territorio funciona de forma dependiente provincia → comarca → municipio.
- [x] Puede buscarse por radio desde un municipio.
- [x] Existe un filtro diferenciado para el estado oficial CIDO.
- [x] Existe un filtro calculado de plazo de solicitud.
- [x] Existe filtrado por fecha de fin del plazo de solicitud.
- [x] Existen filtros de reservas.
- [x] Existe ordenación explícita de resultados.
- [x] Existe paginación.
- [x] Los filtros y la ordenación se conservan al paginar.
- [x] El estado del buscador se conserva al entrar en el detalle y volver.
- [x] Los resultados muestran información enriquecida suficiente.
- [x] Los títulos se normalizan visualmente sin alterar el dato original.
- [x] `0` o `null` plazas se presentan como `Sin definir` cuando no es una bolsa.
- [x] Las bolsas de trabajo muestran `—` como número de plazas.
- [x] Estado oficial y plazo calculado se diferencian visualmente.
- [x] Los principales comportamientos disponen de pruebas.

---

## 20. Estado final

```text
SPEC-001 — Modelo de datos CIDO ✅
SPEC-002 — Modelo Prisma CIDO ✅
SPEC-003 — Integración y sincronización CIDO ✅
SPEC-004 — Buscador de convocatorias ✅
SPEC-005 — Detalle de convocatoria ✅
SPEC-006 — Seguimiento personal y Mis convocatorias ⏳
```

El siguiente bloque de desarrollo es:

```text
SPEC-006 — Seguimiento personal y Mis convocatorias
```
