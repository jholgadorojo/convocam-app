# SPEC-007 — Perfil del opositor

| Campo | Valor |
|---|---|
| Proyecto | **Convoca'm** |
| Especificación | **SPEC-007** |
| Versión del documento | **1.0 — definitiva** |
| Estado | **Finalizada y validada** |
| Fecha de cierre | **15 de octubre de 2026** |
| Área funcional | Portal personal del opositor |
| Ruta principal | `/mi-perfil` |
| Dependencias | SPEC-001 a SPEC-006; Better Auth; integración CIDO; catálogo territorial Idescat |

## 1. Objetivo

Proporcionar al usuario autenticado de Convoca'm un **perfil personal y persistente** desde el que pueda consultar y gestionar su información básica, residencia, titulaciones académicas y preferencias de convocatorias públicas de Catalunya.

La funcionalidad prepara los datos necesarios para una **personalización futura** del portal. En esta especificación **no** se realiza filtrado automático, emparejamiento ni recomendación de convocatorias a partir del perfil.

La interfaz visible está en **castellano**; los nombres del código y de las entidades técnicas se mantienen en **inglés**. La implementación respeta **Clean Architecture** y el módulo `user-profile` existente.

## 2. Alcance funcional implementado

La página `/mi-perfil` agrupa **cinco apartados**, independientes entre sí:

| Nº | Apartado | Resultado |
|---|---|---|
| 1 | Datos personales | Consulta y edición del nombre y los apellidos |
| 2 | Residencia | Selección de un municipio de Catalunya y presentación de su comarca y provincia |
| 3 | Formación académica | Alta, consulta y eliminación/gestión de varias titulaciones finalizadas |
| 4 | Preferencias territoriales | Selección de toda Catalunya o de varias provincias, comarcas y municipios |
| 5 | Preferencias profesionales | Preferencia por plazas/bolsas, materias CIDO y grupos de titulación |

Los cinco apartados se implementaron y fueron **validados funcionalmente por el usuario**.

### 2.1. Datos personales

- Nombre (`firstName`) y apellidos (`lastName`) editables desde el perfil.
- Correo electrónico asociado a la cuenta **visible y no editable** desde este formulario; su gestión corresponde a Better Auth.
- Coherencia del nombre mostrado en la cuenta con los datos personales del perfil, mediante la sincronización prevista con `User.name`.
- No se solicita DNI/NIE, fecha de nacimiento ni otros datos que no sean necesarios en esta fase.

### 2.2. Residencia

- Selección de **un único municipio** de Catalunya mediante un catálogo territorial propio importado de **Idescat**.
- Comarca y provincia obtenidas de la relación del municipio seleccionado; el usuario no necesita introducirlas manualmente.
- Se conservan los identificadores territoriales utilizados por el catálogo.
- No se solicita dirección postal ni domicilio exacto.
- **La residencia no impone ni modifica las preferencias territoriales.**

### 2.3. Formación académica

- Un opositor puede registrar **varias titulaciones**.
- Cada titulación dispone de su **tipo** y **denominación**.
- Se registran **estudios finalizados**, no estudios en curso.
- Las titulaciones se almacenan asociadas al perfil y pueden gestionarse desde `/mi-perfil`.
- Las titulaciones **no restringen automáticamente** los grupos de titulación que el opositor puede elegir en sus preferencias profesionales.

### 2.4. Preferencias territoriales

El apartado permite expresar en qué territorios interesan las convocatorias, de manera independiente de la residencia del usuario.

**Modalidades:**

1. **Sin configurar**: no existe todavía una configuración territorial guardada.
2. **Toda Catalunya**: elección explícita del conjunto del territorio catalán.
3. **Seleccionar territorios**: selección múltiple de **provincias, comarcas y municipios**.

**Reglas:**

- Las selecciones de provincias, comarcas y municipios se interpretarán, cuando exista el filtrado personalizado futuro, mediante **unión lógica (OR)**; no como intersección obligatoria.
- En modalidad de territorios seleccionados debe existir, como mínimo, una selección válida.
- No se permiten identificadores duplicados.
- Los identificadores han de existir en el catálogo de Idescat importado.
- Es posible **guardar, consultar, modificar, descartar cambios, eliminar con confirmación y volver a configurar**.
- Eliminar preferencias devuelve el apartado al estado **«Sin configurar»**.
- «Toda Catalunya» **no** se confunde con «Sin configurar».

**Origen:** catálogo independiente de Idescat, con provincias, comarcas y municipios; no se construye exclusivamente a partir de municipios presentes en convocatorias CIDO.

### 2.5. Preferencias profesionales

Se aprobaron **tres criterios**, todos opcionales:

| Criterio | Comportamiento | Origen |
|---|---|---|
| Tipo de convocatoria | Plazas, bolsas de trabajo, ambas o sin preferencia específica | `selection_processes.isJobPool` y enum del dominio |
| Áreas y materias profesionales | Selección múltiple, con búsqueda | `subject_areas` (CIDO) |
| Grupos de titulación | Selección múltiple | Valores de `selection_processes.qualificationGroup` (CIDO) |

**Reglas:**

- Enum `PreferredSelectionProcessType`: `POSITIONS`, `JOB_POOLS`, `BOTH`.
- `null` indica que no se ha elegido un tipo concreto. `BOTH` representa una elección expresa de ambas clases de convocatoria.
- Se admiten materias y grupos combinados, y también una selección parcial de cualquiera de los criterios.
- Las materias se guardan mediante **identificadores** de `SubjectArea`.
- Los grupos de titulación se guardan como **cadenas de texto CIDO**; no se crea otro catálogo independiente.
- Se eliminan los duplicados y se normalizan los espacios sobrantes.
- Antes de guardar se verifica que **todas** las materias y grupos elegidos figuran en los datos CIDO disponibles.
- La consulta de catálogos contempla también los datos históricos: no se exige que existan convocatorias actualmente activas para cada opción.
- Guardar un registro con todos los criterios vacíos es válido y conserva el estado **«Configurado»**.
- **Eliminar** el registro completo devuelve el estado **«Sin configurar»**.
- Se admiten **guardar, consultar, modificar, descartar cambios, eliminar con confirmación y volver a configurar**.

**Decisión explícita:** **Jornada laboral NO forma parte de las preferencias profesionales**. Se mantiene, sin cambios, el dato de jornada de las convocatorias CIDO allí donde ya exista.

## 3. Experiencia de usuario

### 3.1. Página única

La ruta `/mi-perfil` presenta los cinco apartados en tarjetas dentro del diseño habitual del portal, con la sesión validada en servidor.

Cada componente se inserta exclusivamente en su apartado; en particular, los formularios territoriales y profesionales se muestran **una sola vez** y con separación visual adecuada, evitando encabezados y formularios repetidos.

### 3.2. Estados y acciones

Los apartados de preferencias distinguen entre configuración **guardada** y selección **temporal en edición**:

- **Guardar cambios:** persiste la selección y actualiza la vista.
- **Descartar cambios:** recupera la última configuración guardada sin persistir el borrador.
- **Eliminar preferencias:** requiere confirmación, elimina la configuración completa y presenta «Sin configurar».
- **Recarga de página:** recupera el estado persistido de PostgreSQL.
- **Mensajes:** se informa de éxito y de errores de validación/guardado con textos comprensibles en castellano.

## 4. Modelo de datos y relaciones

La implementación amplía el modelo existente de Prisma/PostgreSQL. Los nombres de modelos y relaciones siguientes resumen el diseño aprobado; **`prisma/schema.prisma` es la fuente de verdad para los tipos y campos exactos**.

### 4.1. Perfil y estudios

- `User` (Better Auth) → `UserProfile`: asociación del perfil con su cuenta autenticada.
- `UserProfile` → `UserAcademicQualification`: relación **uno a muchos**, que permite registrar varias titulaciones finalizadas.
- `UserProfile` → `Municipality`: referencia a la residencia seleccionada; provincia y comarca se resuelven mediante el catálogo territorial.

### 4.2. Catálogo de territorio

- `Province`, `County`, `Municipality`: catálogo territorial Idescat con las relaciones geográficas necesarias.
- `UserTerritorialPreference`: configuración territorial de un perfil; relación **uno a cero/uno** con `UserProfile`, con `userProfileId` único.
- Enum `TerritorialPreferenceScope`: `ALL_CATALONIA` o `SELECTED_TERRITORIES`.
- `UserPreferredProvince`, `UserPreferredCounty`, `UserPreferredMunicipality`: relaciones de selección múltiple, con restricciones de unicidad de pares **preferencia/territorio**.
- Las asociaciones seleccionadas se eliminan junto con su configuración; no se eliminan los datos del catálogo geográfico.

### 4.3. Preferencias profesionales

- `UserProfessionalPreference`: configuración profesional de un perfil, con `userProfileId` único y `selectionProcessType` opcional.
- Enum `PreferredSelectionProcessType`: `POSITIONS`, `JOB_POOLS`, `BOTH`.
- `UserPreferredSubjectArea`: relación múltiple **preferencia/materia**, vinculada a `SubjectArea` mediante `subjectAreaId` y con unicidad del par.
- `UserPreferredQualificationGroup`: relación múltiple **preferencia/grupo**, con valor textual `qualificationGroup` y unicidad del par.
- Las asociaciones profesionales se eliminan junto con su configuración; **no** se eliminan materias de CIDO ni convocatorias.
- Las modificaciones de las relaciones profesionales se ejecutan en una **transacción** de PostgreSQL para evitar estados parcialmente guardados.

### 4.4. Semántica de configuración

| Estado | Territorial | Profesional |
|---|---|---|
| Sin configurar | Ausencia de `UserTerritorialPreference` | Ausencia de `UserProfessionalPreference` |
| Selección explícita amplia | `ALL_CATALONIA` | `BOTH`, si se han elegido expresamente plazas y bolsas |
| Selección específica | `SELECTED_TERRITORIES` y relaciones asociadas | Tipo opcional, materias y grupos |
| Configuración guardada sin criterios | No aplica a `SELECTED_TERRITORIES` sin selección | Registro existente con tipo `null` y arrays vacíos |

## 5. Arquitectura e implementación

Se mantiene la **Clean Architecture** ya adoptada por el proyecto:

```text
Presentation / Next.js (`/mi-perfil`)
              |
              v
Application (DTO, casos de uso, contratos)
              |
              v
Domain (entidades y reglas)
              ^
              |
Infrastructure / Adapters (Prisma, catálogos, Idescat)
              |
              v
PostgreSQL

Composition Root: src/composition/user-profile.ts
```

Los imports de los adaptadores se resuelven en el Composition Root, no desde el dominio.

### 5.1. Principales elementos de la capa de dominio

- `UserProfile`.
- `UserAcademicQualification`.
- `UserTerritorialPreference`.
- `UserProfessionalPreference`.

### 5.2. Casos de uso territoriales

- `GetUserTerritorialPreferences`.
- `SaveUserTerritorialPreferences`.
- `DeleteUserTerritorialPreferences`.
- `GetTerritorialPreferenceOptions`.

Repositorios de selección, catálogo y consulta de opciones, con implementaciones en memoria y Prisma, según corresponda.

### 5.3. Casos de uso profesionales

- `GetUserProfessionalPreferences`.
- `SaveUserProfessionalPreferences`.
- `DeleteUserProfessionalPreferences`.
- `GetProfessionalPreferenceOptions`.

Contratos principales:

- `UserProfessionalPreferenceRepository`.
- `ProfessionalPreferenceCatalogQueryRepository`.
- `ProfessionalPreferenceOptionsQueryRepository`.

Implementaciones Prisma relevantes:

- `PrismaUserProfessionalPreferenceRepository`.
- `PrismaProfessionalPreferenceCatalogQueryRepository`.
- `PrismaProfessionalPreferenceOptionsQueryRepository`.

Los repositorios no exponen directamente registros Prisma a la capa de presentación: los casos de uso entregan DTO y entidades de dominio según corresponda.

### 5.4. Archivos de integración con Next.js

| Archivo | Función |
|---|---|
| `src/app/mi-perfil/page.tsx` | Consulta de datos en servidor y presentación de los cinco apartados |
| `src/app/mi-perfil/territorial-actions.ts` | Guardar y eliminar preferencias territoriales |
| `src/app/mi-perfil/territorial-preferences-section.tsx` | Interfaz territorial interactiva |
| `src/app/mi-perfil/professional-actions.ts` | Guardar y eliminar preferencias profesionales |
| `src/app/mi-perfil/professional-preferences-section.tsx` | Interfaz profesional interactiva |
| `src/composition/user-profile.ts` | Construcción y exportación de los casos de uso |
| `prisma/schema.prisma` | Modelo persistente y relaciones |

Los apartados de datos personales, residencia y estudios utilizan sus componentes y acciones correspondientes, implementados en las fases iniciales de SPEC-007.

## 6. Autenticación, seguridad e integridad

1. **Better Auth:** `/mi-perfil` es una funcionalidad de usuario autenticado.
2. **Usuario real:** las acciones de servidor obtienen `userId` de la sesión; no aceptan como identidad confiable un identificador editable remitido desde el navegador.
3. **Aislamiento:** los casos de uso obtienen `UserProfile` a partir de `userId` y solo manipulan las preferencias de ese perfil.
4. **Validación del dominio:** se comprueban tipos, identificadores válidos, normalización y restricciones de selección.
5. **Validación del catálogo:** se comprueba que los territorios de Idescat y las materias/grupos de CIDO seleccionados existen.
6. **Integridad referencial:** claves únicas, relaciones y eliminación en cascada de asociaciones; los catálogos compartidos no se eliminan.
7. **Atomicidad:** guardado profesional mediante transacción para preservar datos previos si falla alguna operación.
8. **Mensajes de error:** las acciones de servidor devuelven errores útiles de validación, sin exponer detalles internos innecesarios de Prisma o PostgreSQL.

## 7. Datos externos y dependencias

### 7.1. Idescat

El catálogo importado se emplea para elegir la residencia y las preferencias territoriales. Está separado del conjunto de municipios de las convocatorias CIDO para evitar que las opciones geográficas dependan de si hoy existe una convocatoria en un municipio determinado.

### 7.2. CIDO

Se reutilizan los modelos ya existentes de convocatorias y materias:

- `SubjectArea` para áreas y materias.
- `SelectionProcess.qualificationGroup` para grupos de titulación.
- `SelectionProcess.isJobPool` como concepto de plazas frente a bolsas de trabajo.

No se crea un catálogo paralelo para grupos profesionales. Las opciones disponibles se leen de CIDO, incluyendo datos históricos conservados.

## 8. Verificación y criterios de aceptación

**Resultado comunicado por el usuario al cierre (15/10/2026):** todas las comprobaciones funcionales son correctas y las comprobaciones generales de TypeScript y Vitest finalizan correctamente.

### 8.1. Pruebas técnicas

- [x] Comprobación de TypeScript con `pnpm exec tsc --noEmit` sin errores, confirmada por el usuario.
- [x] Ejecución completa de `pnpm exec vitest run` con resultados correctos, confirmada por el usuario.
- [x] Tests de dominio, repositorios, casos de uso y validación de catálogos desarrollados durante la especificación.
- [x] Tests de integración de persistencia de preferencias y rollback de transacciones preparados y ejecutados dentro de la batería validada.
- [x] Base de pruebas independiente `convocam_test` conservada para pruebas de integración; base principal de desarrollo `convocam` restablecida para uso normal.

**Nota de trazabilidad:** los resultados anteriores proceden de la ejecución local y confirmación del usuario; este documento no adjudica al asistente la ejecución de los comandos ni fija una cifra total de tests que no se haya registrado.

### 8.2. Pruebas funcionales

- [x] Datos personales: consulta y modificación.
- [x] Residencia: selección de municipio y visualización de comarca/provincia.
- [x] Formación académica: gestión de múltiples estudios finalizados.
- [x] Preferencias territoriales: toda Catalunya, multiselección, modificación, descarte, eliminación y restauración.
- [x] Preferencias profesionales: plazas/bolsas/ambas, búsqueda de materias, selección múltiple de materias y grupos, guardado, recarga, modificación, descarte, eliminación y nueva configuración.
- [x] Ausencia de duplicación de los formularios en `/mi-perfil`.
- [x] Funcionamiento previo del perfil conservado tras incorporar los nuevos apartados.

### 8.3. Ejecución segura de tests con base aislada

```bash
pnpm exec tsc --noEmit

(
  set -e
  set -a
  . ./.env.test
  set +a

  node -e '
    const database = new URL(process.env.DATABASE_URL);
    const name = decodeURIComponent(database.pathname.slice(1));
    if (name !== "convocam_test") {
      throw new Error("Base de datos incorrecta: " + name);
    }
    console.log("Base de pruebas:", name);
  '

  pnpm exec vitest run
)
```

El paréntesis ejecuta los comandos en un entorno de shell aislado: cargar `.env.test` **no** deja la terminal principal apuntando a la base de pruebas. En desarrollo normal se utiliza `convocam`.

## 9. Funcionalidades expresamente fuera del alcance

Quedan **fuera de SPEC-007** y **no se implementan ni se consideran pendientes para su cierre**:

- Filtrar automáticamente las convocatorias CIDO utilizando el perfil o las preferencias guardadas.
- Crear recomendaciones personalizadas, alertas o coincidencias automáticas.
- Inferir restricciones profesionales o elegibilidad a partir de los estudios guardados.
- Incorporar jornada laboral como preferencia profesional.
- Exigir dirección postal exacta, DNI/NIE o datos personales adicionales no aprobados.
- Cambiar los modelos y funcionalidades de las SPEC-001 a SPEC-006.
- Extender la cobertura geográfica del buscador a toda España; se mantiene como **idea de evolución futura**, sin alterar el alcance actual de Catalunya.

## 10. Decisiones de diseño definitivas

| Decisión | Criterio adoptado |
|---|---|
| Interfaz | Todos los textos visibles en castellano |
| Arquitectura | Clean Architecture y Composition Root |
| Identidad | Better Auth; correo de cuenta no editable en el perfil |
| Residencia | Un municipio; comarca y provincia derivadas |
| Formación | Múltiples titulaciones finalizadas |
| Preferencias territoriales | Toda Catalunya o unión (OR) de territorios seleccionados |
| Selecciones territoriales | Catálogo de Idescat, independiente de residencia y de CIDO |
| Preferencias profesionales | Tipo de convocatoria, materias y grupos de titulación |
| Jornada laboral | Excluida del perfil profesional |
| Materias | Identificadores de `SubjectArea` CIDO |
| Grupos de titulación | Valores textuales de CIDO; sin nuevo catálogo |
| Estado «Sin configurar» | Ausencia de registro de preferencias |
| Guardado profesional | Transaccional, sustitución de relaciones y preservación del registro existente |
| Buscador de convocatorias | Sin filtrado automático por preferencias en esta SPEC |

## 11. Cierre de la especificación

**SPEC-007 queda FINALIZADA Y VALIDADA.**

La funcionalidad del perfil está operativa con los cinco apartados acordados, persistencia de datos, autenticación, validaciones y pruebas generales confirmadas por el usuario.

Este documento cierra el alcance aprobado de SPEC-007. Cualquier nueva funcionalidad (personalización del buscador, recomendaciones, alertas, ampliación geográfica, etc.) deberá definirse y aprobarse en una especificación posterior, sin modificar retroactivamente el alcance de esta.
