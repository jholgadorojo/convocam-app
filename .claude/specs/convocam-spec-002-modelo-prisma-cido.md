# SPEC-002 — Modelo de base de datos Prisma para integración CIDO

**Proyecto:** Convoca'm  
**Versión:** 1.0  
**Estado:** Aprobado para migración tras validación de Prisma  
**Fecha:** 2026-09-30

## 1. Objetivo

Definir el modelo de base de datos PostgreSQL/Prisma que almacenará en Convoca'm los procesos selectivos procedentes de CIDO, sus instituciones, documentos/fases y materias.

La finalidad no es replicar toda la base de datos de CIDO, sino conservar los datos necesarios para:

- buscar y filtrar convocatorias;
- relacionarlas con el perfil del opositor;
- aplicar filtros diferenciales por discapacidad, desempleo, jóvenes y mujeres;
- seguir la evolución de un proceso selectivo;
- acceder a los documentos oficiales;
- analizar esos documentos posteriormente mediante IA;
- sincronizar cambios de CIDO sin duplicar registros.

## 2. Criterios de diseño

### 2.1 Identificadores propios + identificadores CIDO

Convoca'm mantiene un `id` interno autoincremental y conserva el identificador de CIDO en `cidoId`.

Ejemplo:

- `id`: identificador interno de Convoca'm.
- `cidoId`: identificador JSON:API de CIDO.

En `SelectionProcess` también se conserva `cidoIdentifier`, porque CIDO lo define como identificador único de la ficha.

### 2.2 Convención de nombres

- Modelos Prisma: singular y PascalCase.
- Tablas PostgreSQL: plural y snake_case mediante `@@map`.
- Nombres técnicos en inglés.
- Textos visibles de la aplicación en castellano.

### 2.3 Datos oficiales vs. datos calculados

Las tablas descritas en este documento almacenan principalmente información de CIDO y metadatos propios de sincronización.

La información interpretada por IA se almacenará en tablas separadas en una especificación posterior.

### 2.4 Documentos

Convoca'm no almacenará inicialmente los PDF de forma permanente.

Se conserva:

- URL principal del documento;
- URL HTML si existe;
- fase;
- boletín;
- fecha;
- metadatos.

Más adelante el documento podrá descargarse temporalmente, analizarse mediante IA y almacenar el resultado estructurado.

`documentUrl` corresponde al campo `urlPdf` de CIDO. Se denomina así porque se ha comprobado que CIDO puede devolver en ese campo una URL web que no termina directamente en `.pdf`.

## 3. Diagrama lógico

```text
Institution
    |
    | 1:N
    v
SelectionProcess
    |
    +---- 1:N ----> SelectionProcessDocument
    |
    +---- N:M ----> SubjectArea
                     ^
                     |
          SelectionProcessSubjectArea
```

## 4. Modelo Institution

Representa el organismo o institución convocante.

```prisma
model Institution {
  id     Int    @id @default(autoincrement())
  cidoId String @unique

  name      String
  shortName String
  isActive  Boolean

  latitude  Decimal?
  longitude Decimal?

  ineCode      String?
  address      String?
  postalCode   String?
  municipality String?
  countyCode   String?
  county       String?
  provinceCode String?
  province     String?

  contractorProfileUrl String?
  socCode              String?
  sepeCode             String?

  selectionProcesses SelectionProcess[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([municipality])
  @@index([county])
  @@index([province])
  @@map("institutions")
}
```

### Mapeo principal CIDO

| CIDO | Convoca'm |
|---|---|
| `id` | `cidoId` |
| `institucioDesenvolupat` | `name` |
| `institucioAbreujat` | `shortName` |
| `institucioActiva` | `isActive` |
| `latitud` | `latitude` |
| `longitud` | `longitude` |
| `codiIne` | `ineCode` |
| `adreca` | `address` |
| `codiPostal` | `postalCode` |
| `municipi` | `municipality` |
| `codiComarca` | `countyCode` |
| `comarca` | `county` |
| `codiProvincia` | `provinceCode` |
| `provincia` | `province` |
| `urlPerfilContractant` | `contractorProfileUrl` |
| `soc` | `socCode` |
| `sepe` | `sepeCode` |

Los códigos se almacenan como `String` aunque CIDO los entregue numéricamente, porque son identificadores y no cantidades.

No se almacena `urlGoogleMaps`, ya que puede generarse usando latitud y longitud.

## 5. Modelo SelectionProcess

Representa el proceso selectivo o convocatoria.

```prisma
model SelectionProcess {
  id              Int    @id @default(autoincrement())
  cidoId          String @unique
  cidoIdentifier  String @unique
  fileNumber      String?
  publicOfferYear Int?

  title           String
  isJobPool       Boolean
  scopeId         Int
  scopeName       String
  institutionName String

  institutionId Int?
  institution   Institution? @relation(fields: [institutionId], references: [id], onDelete: SetNull)

  documents    SelectionProcessDocument[]
  subjectAreas SelectionProcessSubjectArea[]

  applicationStartDate     DateTime? @db.Date
  applicationEndDate       DateTime? @db.Date
  applicationEndTime       String?
  applicationDeadlineNotes String?

  selectionSystemId    Int?
  selectionSystem      String?
  personnelTypeId      Int?
  personnelType        String?
  qualificationGroupId Int?
  qualificationGroup   String?

  requiredQualification String?
  otherRequirements     String?

  numberOfPositions           Int?
  reservedDisabilityPositions Int?
  reservedUnemployed          Boolean
  reservedYoung               Boolean
  reservedWomen               Boolean

  firstExamDate DateTime? @db.Date
  observations  String?

  institutionUrl String?
  applicationUrl String?
  cidoUrl        String

  statusId Int
  status   String

  lastDocumentPublicationDate DateTime? @db.Date

  sourceSyncedAt DateTime @default(now())
  sourceHash     String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([institutionId])
  @@index([statusId])
  @@index([isJobPool])
  @@index([scopeId])
  @@index([qualificationGroupId])
  @@index([applicationEndDate])
  @@map("selection_processes")
}
```

### Campos diferenciales de Convoca'm

Se conservan expresamente:

- `reservedDisabilityPositions`
- `reservedUnemployed`
- `reservedYoung`
- `reservedWomen`

Estos datos se consideran esenciales porque Convoca'm debe poder cruzar las características del usuario con las convocatorias disponibles.

## 6. Modelo SelectionProcessDocument

Representa cada publicación o fase oficial de un proceso.

```prisma
model SelectionProcessDocument {
  id     Int    @id @default(autoincrement())
  cidoId String @unique

  selectionProcessId Int
  selectionProcess   SelectionProcess @relation(fields: [selectionProcessId], references: [id], onDelete: Cascade)

  publicationDate DateTime @db.Date
  summary         String
  publisher       String?

  bulletinId     Int
  bulletin       String
  bulletinNumber Int?
  entryDate      DateTime @db.Date

  phaseId    Int
  phase      String
  phaseNotes String?

  documentUrl String
  htmlUrl     String?

  sourceSyncedAt DateTime @default(now())
  sourceHash     String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([selectionProcessId])
  @@index([publicationDate])
  @@index([phaseId])
  @@map("selection_process_documents")
}
```

Una convocatoria puede tener múltiples fases: oferta pública, bases, convocatoria, temario, admitidos/excluidos, fecha de prueba, resultados o resolución.

Si se elimina un proceso selectivo, sus documentos se eliminan mediante `onDelete: Cascade`.

## 7. Modelo SubjectArea

Clasificación temática de CIDO.

```prisma
model SubjectArea {
  id           Int    @id @default(autoincrement())
  cidoId       String @unique
  name         String
  cidoModuleId Int

  selectionProcesses SelectionProcessSubjectArea[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("subject_areas")
}
```

Ejemplos reales validados:

- Medi ambient
- Biologia
- Geografia

`cidoModuleId = 4` corresponde al módulo de oposiciones.

La jerarquía interna de materias de CIDO no se almacenará en esta primera versión.

## 8. Relación SelectionProcessSubjectArea

Relación muchos-a-muchos entre procesos y materias.

```prisma
model SelectionProcessSubjectArea {
  selectionProcessId Int
  subjectAreaId      Int

  selectionProcess SelectionProcess @relation(fields: [selectionProcessId], references: [id], onDelete: Cascade)
  subjectArea      SubjectArea      @relation(fields: [subjectAreaId], references: [id], onDelete: Cascade)

  @@id([selectionProcessId, subjectAreaId])
  @@index([subjectAreaId])
  @@map("selection_process_subject_areas")
}
```

La clave primaria compuesta evita duplicar una materia dentro de una misma convocatoria.

## 9. Metadatos de sincronización

`SelectionProcess` y `SelectionProcessDocument` disponen de:

- `sourceSyncedAt`: última sincronización realizada con la fuente.
- `sourceHash`: huella del contenido utilizada para detectar cambios.

Flujo previsto:

```text
CIDO
  |
  v
obtener registro
  |
  v
calcular hash
  |
  +-- igual --> no actualizar contenido
  |
  +-- distinto --> actualizar registro
```

## 10. Estrategia para IA

La IA no modificará los datos originales de CIDO.

Flujo previsto:

```text
SelectionProcessDocument
        |
        v
documentUrl
        |
        v
descarga temporal
        |
        v
análisis IA
        |
        v
resultado estructurado en tablas propias
```

Entre los datos a extraer posteriormente:

- tasas;
- temario;
- requisitos;
- pruebas;
- méritos;
- plazos;
- documentación necesaria;
- fechas relevantes.

La información extraída por IA debe estar claramente diferenciada de la información oficial.

## 11. Decisiones aplazadas

Quedan fuera de esta especificación:

- tablas de análisis IA;
- historial de cambios;
- sincronizaciones programadas;
- seguimiento del usuario;
- convocatorias guardadas;
- alertas;
- tareas del opositor;
- jerarquía de materias CIDO;
- almacenamiento permanente de PDF.

Se definirán mediante especificaciones posteriores.

## 12. Próximo paso

1. Aplicar los ajustes finales en `schema.prisma`.
2. Ejecutar `pnpm exec prisma format`.
3. Ejecutar `pnpm exec prisma validate`.
4. Crear una única migración para el bloque CIDO.
5. Verificar las tablas creadas en PostgreSQL.
6. Implementar posteriormente el cliente y sincronización CIDO -> Convoca'm.
