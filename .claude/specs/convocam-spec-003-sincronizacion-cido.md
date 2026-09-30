# SPEC-003 — Sincronización CIDO

**Proyecto:** Convoca'm  
**Versión:** 1.0  
**Fecha:** 30/09/2026  
**Estado:** Aprobada

---

# 1. Objetivo

Definir cómo Convoca'm sincroniza los procesos selectivos publicados por CIDO con su propia base de datos PostgreSQL.

La aplicación no debe consultar CIDO directamente cada vez que un usuario busca una convocatoria.

El flujo principal será:

```text
CIDO
  ↓
Sincronización
  ↓
PostgreSQL de Convoca'm
  ↓
Buscador / Dashboard / Perfil del opositor
```

CIDO es la fuente oficial de datos.

Convoca'm mantiene una copia estructurada para poder buscar, filtrar, relacionar, personalizar resultados y conservar histórico.

---

# 2. Alcance de esta SPEC

Esta especificación cubre la sincronización de:

- procesos selectivos;
- instituciones;
- materias;
- relación proceso ↔ materia;
- documentos oficiales;
- estados y control de presencia en CIDO;
- paginación;
- actualización de registros existentes;
- detección segura de registros que dejan de aparecer.

Queda fuera de esta SPEC:

- análisis de documentos mediante IA;
- extracción de temario;
- extracción de requisitos;
- extracción de tasas;
- extracción de pruebas;
- extracción de documentación necesaria;
- interpretación automática de bases.

Ese bloque se documentará en una especificación posterior.

---

# 3. Estados CIDO utilizados

Los estados identificados son:

| ID | Estado |
|---|---|
| 1 | Pendent de convocatòria |
| 2 | Pendent de termini |
| 3 | Termini obert |
| 4 | Termini tancat |
| 5 | Procés no vigent |
| 6 | Resolt |

La sincronización principal obtiene los procesos con estados:

```text
1, 2, 3
```

Estos son los procesos que Convoca'm considera relevantes para la búsqueda principal.

Los estados 4, 5 y 6 no se eliminan de la base de datos si un proceso pasa posteriormente a uno de ellos.

---

# 4. Arquitectura

La sincronización respeta Clean Architecture.

## Application

Define contratos y casos de uso.

No conoce:

- Prisma;
- PostgreSQL;
- detalles de CIDO;
- URLs externas.

Principales contratos:

```text
SelectionProcessSource
InstitutionSource
SubjectAreaSource
SelectionProcessDocumentSource

SelectionProcessRepository
InstitutionRepository
SubjectAreaRepository
SelectionProcessDocumentRepository
SelectionProcessSubjectAreaRepository
```

## Infrastructure

Implementa esos contratos.

### CIDO

```text
CidoSelectionProcessSource
CidoInstitutionSource
CidoSubjectAreaSource
CidoSelectionProcessDocumentSource
```

### Prisma

```text
PrismaSelectionProcessRepository
PrismaInstitutionRepository
PrismaSubjectAreaRepository
PrismaSelectionProcessDocumentRepository
PrismaSelectionProcessSubjectAreaRepository
```

## Composition Root

Archivo:

```text
src/composition/selection-process.ts
```

Es el lugar donde se conectan las implementaciones reales:

```text
CIDO + Prisma → casos de uso
```

---

# 5. Flujo de sincronización de una página

El caso de uso principal de una página es:

```text
SyncSelectionProcesses
```

Para cada proceso selectivo:

```text
1. Obtener proceso desde CIDO
2. Mapearlo al formato interno de Convoca'm
3. Obtener su institución
4. Crear o actualizar la institución
5. Crear o actualizar el proceso selectivo
6. Obtener sus materias
7. Crear o actualizar las materias
8. Reemplazar las relaciones proceso ↔ materias
9. Obtener documentos oficiales
10. Crear o actualizar documentos
11. Marcar como inactivos los documentos que ya no aparecen
```

---

# 6. Upsert

Los registros provenientes de CIDO se guardan mediante `upsert`.

Conceptualmente:

```text
¿Existe el cidoId?

NO
→ INSERT

SÍ
→ UPDATE
```

El `cidoId` es la identidad externa del registro en CIDO.

Se utiliza para evitar duplicados.

Este patrón se aplica a:

- procesos selectivos;
- instituciones;
- materias;
- documentos.

---

# 7. Procesos selectivos

Tabla:

```text
selection_processes
```

Un proceso se identifica externamente por:

```text
cidoId
```

La sincronización actualiza, entre otros:

- título;
- institución;
- ámbito;
- bolsa de trabajo;
- fechas;
- sistema de selección;
- tipo de personal;
- grupo de titulación;
- requisitos;
- plazas;
- reservas;
- estado;
- URLs;
- última publicación documental.

Los campos de reserva considerados especialmente importantes para Convoca'm son:

```text
reservedDisabilityPositions
reservedUnemployed
reservedYoung
reservedWomen
```

Estos campos permitirán posteriormente personalizar y filtrar oportunidades según el perfil del usuario.

---

# 8. Instituciones

Tabla:

```text
institutions
```

Por cada convocatoria se consulta su institución.

La institución se guarda una sola vez por `cidoId`.

Datos principales:

- nombre;
- nombre corto;
- activa/inactiva;
- latitud;
- longitud;
- código INE;
- dirección;
- código postal;
- municipio;
- comarca;
- provincia;
- perfil del contratante;
- código SOC;
- código SEPE.

Los códigos se almacenan como texto y no como cantidades.

Ejemplo:

```text
08001
```

debe conservar el cero inicial.

No se almacena `urlGoogleMaps`.

Si es necesario, podrá construirse posteriormente utilizando latitud y longitud.

---

# 9. Materias

Tabla:

```text
subject_areas
```

Ejemplos reales observados:

```text
Medi ambient
Biologia
Geografia
```

Cada materia se identifica por su `cidoId`.

Campos:

```text
cidoId
name
cidoModuleId
```

---

# 10. Relación proceso ↔ materia

Tabla:

```text
selection_process_subject_areas
```

Es una relación muchos a muchos.

Ejemplo:

```text
Convocatoria 15
 ├── Medi ambient
 ├── Biologia
 └── Geografia
```

La estrategia utilizada es `replaceAll`.

Esto significa:

```text
1. Eliminar relaciones anteriores del proceso
2. Crear exactamente las relaciones actuales devueltas por CIDO
```

Así se evita conservar materias que CIDO ya no relaciona con la convocatoria.

La operación se ejecuta dentro de una transacción Prisma.

---

# 11. Documentos oficiales

Tabla:

```text
selection_process_documents
```

Por cada proceso se consulta:

```text
/oposicions/{cidoId}/documents
```

Datos principales:

- fecha de publicación;
- resumen;
- anunciante;
- boletín;
- número de boletín;
- fecha de entrada;
- fase;
- observaciones de fase;
- URL principal;
- URL HTML.

---

# 12. `documentUrl`

CIDO utiliza el nombre:

```text
urlPdf
```

pero se ha comprobado que dicho campo no siempre apunta directamente a un archivo PDF.

Puede apuntar a:

- PDF;
- página web;
- visor oficial.

Por ese motivo Convoca'm utiliza:

```text
documentUrl
```

y no:

```text
pdfUrl
```

La selección es:

```text
urlPdf
↓ si no existe
urlHtml
```

Si no existe ninguno de los dos, el mapper considera que el documento no es procesable y genera un error.

---

# 13. Los documentos no se almacenan físicamente

Convoca'm no guarda inicialmente copias permanentes de PDFs o documentos oficiales.

Se almacena:

```text
URL oficial + metadatos
```

Cuando sea necesario analizar un documento:

```text
documentUrl
   ↓
descarga temporal / lectura
   ↓
IA
   ↓
información estructurada
```

Los resultados producidos por IA se almacenarán separados de los datos oficiales.

---

# 14. Seguimiento del origen

Los procesos y documentos contienen:

```text
sourceSyncedAt
sourceHash
sourceActive
sourceLastSeenAt
```

## sourceSyncedAt

Indica cuándo se sincronizó el registro.

## sourceLastSeenAt

Indica la última vez que CIDO confirmó que el registro seguía existiendo.

## sourceActive

Indica si el registro continúa presente en CIDO.

## sourceHash

Reservado para poder detectar posteriormente si el contenido ha cambiado sin comparar campo por campo.

Todavía no se utiliza activamente.

---

# 15. Registros históricos

Convoca'm no elimina físicamente procesos o documentos simplemente porque dejen de aparecer.

Se utiliza:

```text
sourceActive = false
```

Esto permite conservar:

- histórico;
- seguimiento del usuario;
- referencias anteriores;
- futuros análisis IA;
- trazabilidad.

---

# 16. Documentos que dejan de aparecer

Para los documentos sí es seguro comprobar ausencias porque se consulta la colección completa de documentos de una convocatoria.

Ejemplo:

```text
BD:
A
B
C

CIDO:
A
C
```

Resultado:

```text
A → sourceActive = true
B → sourceActive = false
C → sourceActive = true
```

El documento B no se elimina.

---

# 17. Paginación de procesos

La sincronización completa se implementa mediante:

```text
SyncAllSelectionProcesses
```

La estrategia prevista utiliza páginas de:

```text
500 registros
```

Ejemplo:

```text
limit=500 offset=0
limit=500 offset=500
limit=500 offset=1000
...
```

hasta alcanzar el total informado por CIDO.

---

# 18. Sincronización completa

La sincronización completa registra:

```text
syncStartedAt
```

antes de comenzar.

Después recorre todas las páginas.

Solo cuando todas las páginas han terminado correctamente se puede iniciar la reconciliación de procesos que no hayan sido vistos.

---

# 19. Seguridad ante sincronizaciones incompletas

Una regla fundamental es:

```text
Si falla una sola página:
NO ejecutar reconciliación de ausentes.
```

Ejemplo:

```text
Página 1 ✅
Página 2 ✅
Página 3 ❌
```

Resultado:

```text
Sincronización incompleta
→ se propaga el error
→ no se buscan desaparecidos
→ no se marca ningún proceso como inactivo por ausencia
```

Esto evita falsos positivos.

---

# 20. Procesos no vistos

Después de una sincronización completa se buscan candidatos que cumplan:

```text
sourceActive = true

statusId IN (1,2,3)

sourceLastSeenAt < syncStartedAt
```

Esto significa:

> Antes pertenecían al conjunto activo, pero no han aparecido durante la nueva sincronización completa.

Estos procesos son solo candidatos.

No se marcan directamente como inactivos.

---

# 21. Cambio de estado vs eliminación

Cada candidato se consulta directamente en CIDO mediante:

```text
/oposicions/{cidoId}
```

Sin filtro de estado.

## Caso A — sigue existiendo

Ejemplo:

```text
antes:
statusId = 3

ahora:
statusId = 4
```

Resultado:

```text
sourceActive = true
statusId = 4
```

El proceso sigue existiendo.

Simplemente ha cambiado de estado.

## Caso B — CIDO devuelve 404

Resultado:

```text
sourceActive = false
```

El proceso se conserva en Convoca'm como histórico.

---

# 22. Errores de CIDO durante reconciliación

Solo un `404` se interpreta como:

```text
registro no encontrado
```

Otros errores como:

```text
500
503
timeout
error de red
```

no deben convertirse en `sourceActive = false`.

En esos casos se lanza error y se detiene la reconciliación.

Regla:

```text
404
→ null
→ sourceActive = false

otros errores
→ exception
→ NO desactivar
```

---

# 23. Coordinador final

El caso de uso:

```text
RunSelectionProcessSync
```

coordina:

```text
1. SyncAllSelectionProcesses
2. Solo si termina correctamente:
   ReconcileMissingSelectionProcesses
```

Conceptualmente:

```text
Sincronizar todas las páginas
            ↓
       ¿todo correcto?
        /          \
      NO            SÍ
      ↓              ↓
    ERROR       Reconciliar
```

---

# 24. Resultado de sincronización

La sincronización de páginas devuelve métricas como:

```text
totalAvailable
processed
institutionsProcessed
subjectAreasProcessed
documentsProcessed
```

La sincronización completa añade:

```text
syncStartedAt
pagesProcessed
```

La reconciliación devuelve:

```text
checked
updated
deactivated
```

Esto permite conocer qué ocurrió en cada ejecución.

---

# 25. Controles de seguridad implementados

## 25.1 No duplicar procesos

```text
cidoId + upsert
```

## 25.2 No duplicar instituciones

```text
cidoId + upsert
```

## 25.3 No duplicar materias

```text
cidoId + upsert
```

## 25.4 No duplicar documentos

```text
cidoId + upsert
```

## 25.5 Actualizar registros existentes

Los datos recibidos desde CIDO sustituyen los datos sincronizables anteriores.

## 25.6 Mantener correctamente materias

Se utiliza `replaceAll`.

## 25.7 Detectar documentos retirados

Se utiliza:

```text
sourceActive = false
```

## 25.8 No confundir paginación con desaparición

Solo se buscan procesos ausentes después de terminar una sincronización completa.

## 25.9 No reconciliar si falla una página

La excepción evita ejecutar la reconciliación.

## 25.10 Diferenciar cambio de estado de desaparición

Se realiza consulta individual del proceso.

## 25.11 Desactivar solo ante desaparición real

Solo un `404` devuelve `null` y puede acabar en:

```text
sourceActive = false
```

## 25.12 Reactivación automática

Si un registro previamente marcado como inactivo vuelve a aparecer, el `upsert` vuelve a establecer:

```text
sourceActive = true
```

---

# 26. Tests de seguridad

El caso de uso:

```text
ReconcileMissingSelectionProcesses
```

debe disponer al menos de tests para:

## Registro no encontrado

```text
getByCidoId → null
```

Resultado:

```text
markSourceInactive()
```

## Error externo

```text
getByCidoId → exception
```

Resultado:

```text
NO llamar a markSourceInactive()
```

La excepción debe propagarse.

---

# 27. Estructura principal de archivos

```text
src/modules/selection-process/
│
├── application/
│   ├── institution-repository.ts
│   ├── institution-source.ts
│   ├── institution-sync-data.ts
│   ├── subject-area-repository.ts
│   ├── subject-area-source.ts
│   ├── subject-area-sync-data.ts
│   ├── selection-process-document-repository.ts
│   ├── selection-process-document-source.ts
│   ├── selection-process-document-sync-data.ts
│   ├── selection-process-repository.ts
│   ├── selection-process-source.ts
│   ├── selection-process-sync-data.ts
│   ├── selection-process-sync-candidate.ts
│   ├── selection-process-subject-area-repository.ts
│   ├── sync-selection-processes.ts
│   ├── sync-all-selection-processes.ts
│   ├── reconcile-missing-selection-processes.ts
│   └── run-selection-process-sync.ts
│
└── infrastructure/
    │
    ├── cido/
    │   ├── cido-client.ts
    │   ├── cido-types.ts
    │   ├── cido-selection-process-source.ts
    │   ├── cido-selection-process-mapper.ts
    │   ├── cido-institution-source.ts
    │   ├── cido-institution-mapper.ts
    │   ├── cido-institution-types.ts
    │   ├── cido-subject-area-source.ts
    │   ├── cido-subject-area-mapper.ts
    │   ├── cido-subject-area-types.ts
    │   ├── cido-selection-process-document-source.ts
    │   ├── cido-selection-process-document-mapper.ts
    │   └── cido-selection-process-document-types.ts
    │
    └── prisma/
        ├── prisma-selection-process-repository.ts
        ├── prisma-institution-repository.ts
        ├── prisma-subject-area-repository.ts
        ├── prisma-selection-process-subject-area-repository.ts
        └── prisma-selection-process-document-repository.ts
```

Composition Root:

```text
src/composition/selection-process.ts
```

---

# 28. Flujo global final

```text
                   CIDO
                    │
                    ▼
       ┌────────────────────────┐
       │ procesos estados 1,2,3 │
       └───────────┬────────────┘
                   │
              paginación
                   │
                   ▼
          SelectionProcess
             /     |      \
            /      |       \
           ▼       ▼        ▼
   Institution  Subject   Documents
                   │
                   ▼
               PostgreSQL
                   │
                   ▼
       sincronización completa
                   │
                   ▼
          procesos no vistos
                   │
                   ▼
        consulta individual CIDO
             /             \
        existe              404
          │                  │
          ▼                  ▼
 actualizar estado    sourceActive=false
```

---

# 29. Decisiones finales

1. CIDO es la fuente oficial.
2. Convoca'm trabaja principalmente desde su propia base de datos.
3. No se consulta CIDO en cada búsqueda del usuario.
4. Los datos externos se traducen mediante mappers.
5. Application no depende de CIDO ni Prisma.
6. Los registros externos se identifican mediante `cidoId`.
7. Se utiliza `upsert` para evitar duplicados.
8. Los documentos no se borran cuando dejan de aparecer.
9. Las convocatorias tampoco se borran cuando dejan de aparecer.
10. Solo un `404` confirmado puede provocar `sourceActive = false`.
11. Los cambios de estado no implican desaparición.
12. Nunca se reconcilian ausentes tras una sincronización incompleta.
13. Los documentos oficiales y las futuras interpretaciones de IA deben almacenarse separadamente.
14. Los PDFs no se almacenan permanentemente en esta fase.
15. El buscador de Convoca'm utilizará PostgreSQL y no CIDO directamente.

---

# 30. Estado de implementación

```text
Procesos selectivos                  ✅
Instituciones                        ✅
Materias                             ✅
Relación proceso ↔ materia           ✅
Documentos                           ✅
Upsert                               ✅
Control sourceActive                 ✅
Control sourceLastSeenAt             ✅
Documentos retirados                 ✅
Paginación completa                  ✅
Detección de procesos no vistos      ✅
Cambio de estado vs eliminación      ✅
Protección ante fallo parcial        ✅
Desactivación solo ante 404          ✅
Tests básicos de reconciliación      ✅
```

Con esta SPEC se considera cerrado el diseño de la sincronización base CIDO → Convoca'm.

El siguiente bloque funcional podrá centrarse en utilizar los datos sincronizados desde PostgreSQL y, posteriormente, en el análisis inteligente de documentos oficiales.
