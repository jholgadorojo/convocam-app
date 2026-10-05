# SPEC-005 — Detalle de convocatoria

## Estado

**Finalizada ✅**

## Proyecto

**Convoca'm**

Portal personal del opositor para consultar, seguir y gestionar procesos selectivos y bolsas de trabajo de acceso libre en Catalunya, utilizando CIDO como fuente oficial de información.

---

# 1. Objetivo

El objetivo de esta especificación es implementar la **pantalla de detalle de una convocatoria** a partir de los datos previamente sincronizados desde CIDO a PostgreSQL.

La pantalla debe permitir consultar de forma clara y estructurada:

- Datos generales de la convocatoria.
- Organismo convocante.
- Tipo de convocatoria.
- Estado oficial.
- Plazo de presentación de solicitudes.
- Requisitos.
- Cronología del proceso.
- Fechas importantes.
- Documentos oficiales.
- Fuentes oficiales.
- Referencia CIDO.
- Preparación visual para futuras funcionalidades personales.

La consulta del detalle es pública y no requiere autenticación.

---

# 2. Alcance

SPEC-005 incluye:

- Consulta de una convocatoria por su identificador interno.
- Repositorio específico de detalle.
- Caso de uso para recuperar una convocatoria.
- DTO específico de detalle.
- Pantalla `/convocatorias/[id]`.
- Integración con la búsqueda implementada en SPEC-004.
- Conservación de filtros y página al volver al listado.
- Estado oficial de CIDO.
- Estado calculado del plazo de presentación.
- Cronología construida únicamente con datos reales.
- Documentos oficiales.
- Fuentes oficiales.
- Presentación diferenciada entre plaza de plantilla y bolsa de trabajo.
- Mejora del listado de resultados con información adicional.
- Normalización visual de títulos procedentes de CIDO.

Quedan fuera de SPEC-005:

- Seguir o guardar convocatorias.
- Estado personal del usuario.
- Notificaciones.
- Alertas.
- Calendario personal.
- Análisis mediante IA de documentos.
- Almacenamiento de PDFs.

---

# 3. Principios de diseño

## 3.1 Fuente oficial

CIDO sigue siendo la fuente principal de información.

Convoca'm no modifica los datos oficiales almacenados. La aplicación únicamente sincroniza, estructura y presenta la información de forma más clara.

## 3.2 Separación entre datos y presentación

Los datos originales se conservan en PostgreSQL. Mejoras visuales como colores de estado, cálculo del plazo o normalización de títulos se aplican únicamente en presentación.

Ejemplo:

```text
PostgreSQL
TÈCNIC/A SUPERIOR EN INFORMÀTICA

        ↓ presentación

Tècnic/a Superior en Informàtica
```

## 3.3 Arquitectura

Se mantiene Clean Architecture:

```text
Domain
Application
Infrastructure / Adapters
Presentation
Composition
```

Flujo:

```text
Next.js
   ↓
Use Case
   ↓
Repository Interface
   ↓
Prisma Repository
   ↓
PostgreSQL
```

La página Next.js no accede directamente a Prisma.

---

# 4. Ruta de detalle

Ruta:

```text
/convocatorias/[id]
```

Ejemplo:

```text
/convocatorias/1256
```

Se utiliza el `id` interno de PostgreSQL y no `cidoIdentifier` como clave de navegación.

---

# 5. DTO de detalle

Archivo:

```text
src/modules/selection-process/application/dto/selection-process-detail.dto.ts
```

Contrato final:

```ts
export type SelectionProcessDetailDto = {
  id: number;
  cidoIdentifier: string;
  fileNumber: string | null;
  publicOfferYear: number | null;
  title: string;
  isJobPool: boolean;
  status: string;
  scope: string;
  applicationStartDate: Date | null;
  applicationEndDate: Date | null;
  applicationEndTime: string | null;
  applicationDeadlineNotes: string | null;
  selectionSystem: string | null;
  personnelType: string | null;
  qualificationGroup: string | null;
  requiredQualification: string | null;
  otherRequirements: string | null;
  numberOfPositions: number | null;
  firstExamDate: Date | null;
  observations: string | null;
  applicationUrl: string | null;
  institutionUrl: string | null;
  cidoUrl: string;
  lastDocumentPublicationDate: Date | null;
  reservedPlaces: {
    disability: number | null;
    unemployed: boolean;
    youngPeople: boolean;
    women: boolean;
  };
  institution: {
    id: number;
    name: string;
    shortName: string;
    address: string | null;
    postalCode: string | null;
    municipality: string | null;
    county: string | null;
    province: string | null;
    latitude: number | null;
    longitude: number | null;
  } | null;
  subjectAreas: {
    id: number;
    name: string;
  }[];
  documents: {
    id: number;
    publicationDate: Date;
    summary: string;
    publisher: string | null;
    bulletin: string;
    bulletinNumber: number | null;
    phase: string;
    phaseNotes: string | null;
    documentUrl: string;
    htmlUrl: string | null;
  }[];
};
```

---

# 6. Repositorio de aplicación

Archivo:

```text
src/modules/selection-process/application/repositories/selection-process-detail.repository.ts
```

Contrato:

```ts
import type { SelectionProcessDetailDto } from "../dto/selection-process-detail.dto";

export interface SelectionProcessDetailRepository {
  findById(id: number): Promise<SelectionProcessDetailDto | null>;
}
```

---

# 7. Caso de uso

Archivo:

```text
src/modules/selection-process/application/use-cases/get-selection-process-detail.ts
```

Implementación:

```ts
import type { SelectionProcessDetailDto } from "../dto/selection-process-detail.dto";
import type { SelectionProcessDetailRepository } from "../repositories/selection-process-detail.repository";

type GetSelectionProcessDetailInput = {
  id: number;
};

export class GetSelectionProcessDetail {
  constructor(
    private readonly repository: SelectionProcessDetailRepository,
  ) {}

  async execute(
    input: GetSelectionProcessDetailInput,
  ): Promise<SelectionProcessDetailDto | null> {
    return this.repository.findById(input.id);
  }
}
```

Responsabilidad:

```text
Recibir ID
   ↓
Solicitar detalle al repositorio
   ↓
Devolver convocatoria o null
```

---

# 8. Repositorio Prisma

Archivo:

```text
src/modules/selection-process/infrastructure/prisma/prisma-selection-process-detail-repository.ts
```

Consulta principal:

```ts
findUnique({
  where: { id },
  include: {
    institution: true,
    documents: {
      orderBy: {
        publicationDate: "desc",
      },
    },
    subjectAreas: {
      include: {
        subjectArea: true,
      },
    },
  },
});
```

---

# 9. Convocatorias históricas

El detalle no filtra por:

```text
sourceActive = true
```

Esto es intencionado. Una convocatoria histórica debe seguir siendo consultable aunque ya no forme parte de los procesos activos devueltos por CIDO.

```text
Convocatoria sincronizada
        ↓
CIDO deja de devolverla
        ↓
sourceActive = false
        ↓
continúa disponible mediante su detalle
```

---

# 10. Mapeo Prisma → DTO

## 10.1 Ámbito

Prisma:

```text
scopeName
```

DTO:

```text
scope
```

## 10.2 Reservas

Prisma:

```text
reservedDisabilityPositions
reservedUnemployed
reservedYoung
reservedWomen
```

DTO:

```ts
reservedPlaces: {
  disability: row.reservedDisabilityPositions,
  unemployed: row.reservedUnemployed,
  youngPeople: row.reservedYoung,
  women: row.reservedWomen,
}
```

## 10.3 Coordenadas

Prisma utiliza `Decimal`; el DTO utiliza `number`.

```ts
latitude: institution.latitude?.toNumber() ?? null;
longitude: institution.longitude?.toNumber() ?? null;
```

## 10.4 Documentos

El campo utilizado es:

```text
documentUrl
```

No se utiliza `pdfUrl`. Los PDFs no se almacenan en Convoca'm; se conserva la URL oficial.

---

# 11. Composition Root

El repositorio Prisma se instancia en composición:

```text
PrismaSelectionProcessDetailRepository
                ↓
GetSelectionProcessDetail
                ↓
getSelectionProcessDetailUseCase
```

La página Next.js consume únicamente el caso de uso.

---

# 12. Pantalla de detalle

Archivo:

```text
src/app/convocatorias/[id]/page.tsx
```

Uso:

```ts
getSelectionProcessDetailUseCase.execute({ id });
```

Si el ID no es válido, es menor que 1 o no existe, se utiliza:

```ts
notFound();
```

---

# 13. Diseño final

La pantalla se divide en dos columnas en escritorio:

```text
┌────────────────────────────────────────┬──────────────────────┐
│ Información principal                  │ Resumen lateral      │
│ Resumen                                │ Estado oficial       │
│ Información                            │ Plazo                │
│ Requisitos                             │ Acciones             │
│ Cronología                             │ Mi estado            │
│ Fechas importantes                     │ Referencia CIDO      │
│ Documentos                             │                      │
│ Fuentes                                │                      │
└────────────────────────────────────────┴──────────────────────┘
```

Layout aprobado:

```tsx
<main className="flex-1 px-6 py-8 lg:px-10 lg:pb-12">
  <div className="grid w-full items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
```

No se utiliza un contenedor centrado tipo `mx-auto max-w-[1320px]` porque reducía innecesariamente el espacio disponible.

---

# 14. Cabecera del detalle

Incluye:

- Volver a resultados.
- Tipo de proceso.
- Estado oficial.
- Última publicación.
- Título.
- Organismo.
- Municipio / comarca / provincia.

Tipo de proceso:

```text
Bolsa de trabajo
```

ó:

```text
Plaza de plantilla
```

---

# 15. Resumen

La zona superior muestra:

- Tipo.
- Plazas.
- Grupo.
- Personal.
- Sistema.
- Municipio.

Para bolsas de trabajo:

```text
Plazas: —
```

---

# 16. Información

Se genera un texto descriptivo a partir de datos existentes. No se inventa información.

Ejemplo:

```text
La convocatoria ofrece 2 plazas.
El tipo de personal indicado es funcionario.
El sistema de selección es concurso oposición.
El ámbito de la convocatoria es administración local.
```

---

# 17. Requisitos

Se construyen a partir de:

```text
requiredQualification
otherRequirements
qualificationGroup
```

Si no existe información estructurada:

```text
No hay información estructurada de requisitos.
Consulta las bases oficiales.
```

---

# 18. Cronología

La cronología se genera únicamente con información real disponible.

Fuentes:

- Documentos oficiales.
- Inicio de solicitudes.
- Fin de solicitudes.
- Primera prueba.

No se crean fases inexistentes.

Estados:

```ts
"completed"
"current"
"current-known"
"future"
"unknown"
```

Significado:

- `completed`: hito pasado.
- `current`: hito correspondiente al día actual.
- `current-known`: último hito conocido cuando no existe uno exactamente hoy.
- `future`: hito futuro.
- `unknown`: no puede determinarse.

---

# 19. Zona horaria

Los cálculos temporales utilizan:

```text
Europe/Madrid
```

Esto evita depender de la zona horaria del servidor.

---

# 20. Fechas importantes

Se muestran cuando existen:

- Inicio de solicitudes.
- Fin de solicitudes.
- Primera prueba.
- Última publicación oficial.

Cada fecha se clasifica como:

```text
Finalizada
Hoy
Próxima
Sin determinar
```

---

# 21. Documentos oficiales

Se muestran todos los documentos asociados al proceso.

Información:

- Fase.
- Fecha.
- Resumen.
- Organismo publicador.
- Boletín.
- Número de boletín.
- Notas.
- Enlace al documento.
- Enlace HTML si existe.

Se ordenan por:

```text
publicationDate DESC
```

---

# 22. Bases de la convocatoria

Convoca'm intenta identificar el documento de bases mediante:

```text
phase
summary
phaseNotes
```

Se busca contenido relacionado con:

```text
base
bases
```

Cuando existe un documento adecuado se muestra:

```text
Abrir las bases
```

Esta detección es exclusivamente de presentación.

---

# 23. Fuentes oficiales

Se construyen a partir de:

- Web del organismo.
- URL de presentación de solicitudes.
- CIDO.
- URLs HTML de publicaciones oficiales.

Se eliminan duplicados.

Ejemplos:

```text
Ajuntament de ...
CIDO — Diputació de Barcelona
DOGC
BOPB
Presentación de solicitudes
```

Se muestra además un aviso de que Convoca'm organiza información pública y que deben consultarse las fuentes oficiales antes de presentar una solicitud.

---

# 24. Estado oficial

Archivo compartido:

```text
src/modules/selection-process/presentation/selection-process-status.ts
```

Función:

```ts
getOfficialStatusPresentation(status, statusId?)
```

Devuelve:

```ts
{
  label,
  tone,
  badgeClassName,
  dotClassName,
}
```

Tonos:

```text
green
blue
amber
red
gray
```

La clasificación utiliza principalmente el texto oficial y es tolerante a acentos, mayúsculas y variaciones de escritura.

---

# 25. Estado del plazo de solicitudes

Función:

```ts
getApplicationPeriodPresentation(
  applicationStartDate,
  applicationEndDate,
)
```

Estados:

```ts
"open"
"future"
"closed"
"unknown"
```

Comportamiento:

### Próximamente

```text
Próximamente
Empieza mañana
```

ó:

```text
Próximamente
Empieza en N días
```

### Plazo abierto

```text
Plazo abierto
Quedan N días
```

### Últimos días

Se utiliza un tono de advertencia cuando faltan pocos días.

### Último día

```text
Finaliza hoy
```

### Finalizado

```text
Plazo finalizado
Finalizó el DD/MM/YYYY
```

### Sin información

Se muestra un estado neutral.

---

# 26. Estado oficial ≠ estado del plazo

Son conceptos diferentes.

Ejemplo:

```text
Estado oficial CIDO
En proceso

Plazo de solicitudes
Finalizado
```

Esto permite representar correctamente procesos que continúan activos después de cerrar el período de inscripción.

---

# 27. Barra de progreso

Cuando existen fecha de inicio y fin se calcula visualmente el avance del plazo.

La barra es únicamente informativa.

---

# 28. Preparación para seguimiento personal

Se ha preparado visualmente el botón:

```text
Seguir convocatoria
```

En SPEC-005 permanece desactivado con el mensaje:

```text
Disponible próximamente.
```

También se ha diseñado el bloque:

```text
Mi estado
```

Este estado será privado y no modificará el estado oficial de CIDO.

La persistencia se implementará en SPEC-006 mediante una relación conceptual:

```text
User
   ↓
UserSelectionProcess
   ↓
SelectionProcess
```

---

# 29. Retorno al listado

Uno de los requisitos importantes es conservar exactamente la búsqueda del usuario.

Ejemplo:

```text
/convocatorias?q=informatica&province=Barcelona&county=Vallès+Oriental&page=3
```

Al abrir un detalle se envía la URL del listado mediante `returnTo`.

Al pulsar:

```text
Volver a los resultados
```

se recuperan:

- texto buscado;
- filtros;
- territorio;
- página.

---

# 30. Protección de returnTo

La función `getSafeResultsHref()` solo acepta:

```text
/convocatorias
```

ó:

```text
/convocatorias?...
```

Cualquier otro valor vuelve a `/convocatorias`.

Esto evita redirecciones externas no deseadas.

---

# 31. Mejora del listado de resultados

Durante SPEC-005 también se enriquecieron las tarjetas de SPEC-004.

Cada convocatoria muestra:

### Badges

- Bolsa de trabajo / Plaza de plantilla.
- Estado oficial.
- Estado del plazo.

### Información principal

- Título.
- Organismo.
- Localización.

### Datos rápidos

- Plazas.
- Grupo.
- Personal.
- Sistema.
- Ámbito.
- Fin de solicitudes.

### Reservas

Solo aparecen si existen:

- Discapacidad.
- Desempleados.
- Jóvenes.
- Mujeres.

### Acciones

```text
Ver detalle
Ver convocatoria oficial
```

---

# 32. Contrato del listado

`SelectionProcessListItem` se amplió para soportar las nuevas tarjetas:

```ts
export type SelectionProcessListItem = {
  id: number;
  cidoIdentifier: string;
  title: string;
  isJobPool: boolean;
  statusId: number;
  status: string;
  applicationStartDate: Date | null;
  applicationEndDate: Date | null;
  numberOfPositions: number | null;
  qualificationGroup: string | null;
  personnelType: string | null;
  selectionSystem: string | null;
  scope: string;
  reservedPlaces: {
    disability: number | null;
    unemployed: boolean;
    youngPeople: boolean;
    women: boolean;
  };
  cidoUrl: string;
  institution: {
    name: string;
    municipality: string | null;
    county: string | null;
    province: string | null;
  } | null;
};
```

---

# 33. Normalización visual de títulos

CIDO presenta títulos con distintos criterios de mayúsculas.

Ejemplos originales:

```text
1 plaça de Tècnic de Recursos Humans
1 plaça de Tècnic de medi ambient
TÈCNIC/A SUPERIOR EN INFORMÀTICA
```

Se creó un formateador de presentación:

```text
src/modules/selection-process/presentation/selection-process-title.ts
```

Función:

```ts
formatSelectionProcessTitle(title)
```

El valor almacenado en PostgreSQL no se modifica.

---

# 34. Criterio de títulos

Se normalizan las palabras relevantes y se mantienen conectores en minúscula.

Ejemplos visuales:

```text
1 plaça de Tècnic de Recursos Humans
1 plaça de Tècnic de Medi Ambient
1 plaça de Tècnic/a de Sistemes d'Informació
```

Se preservan siglas y códigos:

```text
A1
A2
B
C1
C2
AP
TIC
IT
SQL
SAP
ERP
GIS
CAD
CIDO
DOGC
BOPB
BOE
UE
```

Conectores que permanecen en minúscula incluyen términos catalanes y castellanos como:

```text
a, al, amb, de, del, dels, en, i, la, les, per, pel, pels, el, els, o
y, con, para, por, los, las, un, una
```

También se contemplan apóstrofos catalanes:

```text
d'administració
l'ajuntament
d'informació
```

El mismo formateador se utiliza tanto en `/convocatorias` como en `/convocatorias/[id]`.

---

# 35. Correcciones de filtros relacionadas

Aunque el buscador pertenece a SPEC-004, durante SPEC-005 se corrigieron comportamientos relacionados con la navegación.

## 35.1 Limpiar

El botón `Limpiar` navega directamente a:

```text
/convocatorias
```

Eliminando búsqueda, filtros, territorio, fechas, reservas y página.

## 35.2 Un único formulario lógico

Se corrigió la interacción entre buscador superior y filtros laterales mediante:

```ts
const FILTER_FORM_ID = "convocatorias-filter-form";
```

El campo de búsqueda y el botón Buscar utilizan ese mismo formulario lógico.

## 35.3 Reinicio correcto del formulario

Se utiliza `filterFormKey` para forzar el remontaje correcto del formulario y de los filtros territoriales cuando cambian los parámetros.

---

# 36. Tests

SPEC-005 incluye tests de aplicación e infraestructura.

## 36.1 Caso de uso

Casos cubiertos:

- devuelve convocatoria existente;
- devuelve `null` si no existe;
- pasa correctamente el ID al repositorio.

## 36.2 Repositorio Prisma

Casos cubiertos:

- mapeo completo;
- institución;
- documentos;
- materias;
- reservas;
- campos opcionales;
- bolsa de trabajo;
- convocatoria histórica.

## 36.3 Histórico

Se verificó específicamente que una convocatoria con:

```text
sourceActive = false
```

continúa siendo consultable por detalle.

---

# 37. Validación TypeScript

Durante la implementación se utilizó:

```bash
pnpm exec tsc --noEmit
```

como comprobación de tipos.

Los cambios finales quedaron compilando correctamente tras ajustar listado, repositorio de consulta, tests, estados y títulos.

---

# 38. Decisiones de UX

- Todos los textos visibles propios de Convoca'm están en castellano.
- Los datos oficiales de CIDO se muestran respetando su contenido.
- No se inventa información inexistente.
- Cuando un dato no existe se utilizan valores como `No especificado`, `No disponible` o `—` según el contexto.
- Los enlaces oficiales se abren en nueva pestaña.
- La consulta de `/convocatorias/[id]` es pública.
- Buscar, filtrar, consultar detalles y abrir fuentes oficiales no requiere autenticación.
- Las funcionalidades personales requerirán login a partir de SPEC-006.

---

# 39. Archivos principales

```text
src/modules/selection-process/
│
├── application/
│   ├── dto/
│   │   └── selection-process-detail.dto.ts
│   ├── repositories/
│   │   └── selection-process-detail.repository.ts
│   └── use-cases/
│       └── get-selection-process-detail.ts
│
├── infrastructure/
│   └── prisma/
│       └── prisma-selection-process-detail-repository.ts
│
└── presentation/
    ├── selection-process-status.ts
    └── selection-process-title.ts
```

Páginas:

```text
src/app/convocatorias/page.tsx
src/app/convocatorias/[id]/page.tsx
```

Composition Root:

```text
src/composition/selection-process.ts
```

---

# 40. Migraciones

SPEC-005 no necesita una migración nueva.

Se utilizan las tablas existentes creadas en SPEC-002 y alimentadas mediante SPEC-003.

---

# 41. Resultado final

Flujo disponible al cerrar SPEC-005:

```text
Usuario
   ↓
/convocatorias
   ↓
Buscar / filtrar
   ↓
Tarjetas enriquecidas
   ↓
Ver detalle
   ↓
/convocatorias/[id]
   ↓
Información
Requisitos
Cronología
Fechas
Documentos
Fuentes oficiales
   ↓
Volver a resultados
   ↓
Se conservan búsqueda, filtros y página
```

---

# 42. Estado de especificaciones

```text
SPEC-001 — Modelo de datos CIDO                         ✅
SPEC-002 — Modelo Prisma CIDO                          ✅
SPEC-003 — Integración y sincronización CIDO           ✅
SPEC-004 — Buscador de convocatorias                   ✅
SPEC-005 — Detalle de convocatoria                     ✅
SPEC-006 — Seguimiento personal y Mis convocatorias    ⏳
```

---

# 43. Siguiente especificación

La siguiente fase será:

```text
SPEC-006 — Seguimiento personal y Mis convocatorias
```

Objetivo conceptual:

```text
User
   ↓
UserSelectionProcess
   ↓
SelectionProcess
```

Permitirá implementar:

- Seguir convocatoria.
- Dejar de seguir.
- Mis convocatorias.
- Estado personal del usuario.
- Separación entre estado oficial y estado personal.
- Redirección a login cuando sea necesario.

Antes de generar código se deberá diseñar y aprobar el modelo de datos `UserSelectionProcess`.

---

# 44. Cierre

**SPEC-005 queda finalizada.**

Convoca'm dispone ya de un flujo público completo:

```text
CIDO
   ↓
Sincronización PostgreSQL
   ↓
Buscador
   ↓
Listado enriquecido
   ↓
Detalle completo
   ↓
Documentos y fuentes oficiales
```

La siguiente fase empieza a convertir el buscador en un verdadero portal personal del opositor mediante **SPEC-006**.
