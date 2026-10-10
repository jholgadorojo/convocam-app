# SPEC-006 — Seguimiento personal de convocatorias y “Mis convocatorias”

**Proyecto:** Convoca'm  
**Estado:** ✅ Finalizada  
**Fecha de cierre:** 10/10/2026  
**Arquitectura:** Clean Architecture  
**Stack:** Next.js + TypeScript + React + PostgreSQL + Prisma + Better Auth + Vitest

---

## 1. Objetivo

Permitir que un usuario autenticado pueda guardar una convocatoria en su espacio personal, seguir su evolución y registrar en qué punto se encuentra dentro del proceso selectivo.

La funcionalidad se apoya en dos ideas principales:

1. **Seguir una convocatoria** crea una relación personal entre el usuario y el proceso selectivo.
2. **Mi estado** representa la situación personal del usuario dentro de esa convocatoria y es independiente del estado oficial publicado por CIDO.

La funcionalidad queda disponible tanto desde el detalle de una convocatoria como desde la página **Mis convocatorias**.

---

## 2. Alcance funcional

La SPEC-006 incluye:

- Seguir una convocatoria.
- Dejar de seguir una convocatoria.
- Consultar si una convocatoria está siendo seguida.
- Cambiar el estado personal del usuario.
- Mostrar las convocatorias seguidas en `/mis-convocatorias`.
- Mantener visibles convocatorias seguidas aunque desaparezcan de los procesos activos de CIDO.
- Mostrar el último documento oficial activo de cada convocatoria.
- Mantener sincronizado el detalle con `Mis convocatorias`.
- Proteger todas las acciones personales mediante sesión.
- Integrar la funcionalidad dentro del detalle de convocatoria.
- Tests unitarios y de integración.

No forma parte de esta SPEC:

- Alertas o notificaciones.
- Recordatorios automáticos.
- Tareas personales.
- Notas privadas.
- Histórico de todos los cambios de estado.
- Transiciones rígidas entre estados.
- Extracción mediante IA de datos adicionales de documentos oficiales.

---

## 3. Regla principal del seguimiento

No existe un campo `isFollowing`.

La existencia de una fila en `user_selection_processes` significa que el usuario está siguiendo la convocatoria.

```text
Existe relación
    ↓
La convocatoria está seguida

No existe relación
    ↓
La convocatoria no está seguida
```

Al dejar de seguir una convocatoria, la relación se elimina.

Si posteriormente el usuario vuelve a seguirla, se crea una nueva relación con nuevas fechas de seguimiento.

---

## 4. Entidad de dominio

La entidad principal es:

```text
UserSelectionProcess
```

Representa la relación personal entre un usuario y una convocatoria.

### Campos

```text
id
userId
selectionProcessId
personalStatus
followedAt
personalStatusUpdatedAt
updatedAt
```

### Significado

| Campo | Descripción |
|---|---|
| `id` | Identificador interno |
| `userId` | Usuario que sigue la convocatoria |
| `selectionProcessId` | Convocatoria seguida |
| `personalStatus` | Estado personal del usuario |
| `followedAt` | Fecha en la que empezó a seguirla |
| `personalStatusUpdatedAt` | Fecha del último cambio de estado personal |
| `updatedAt` | Última actualización técnica de la relación |

---

## 5. Estados personales

Se define el enum:

```ts
export enum PersonalSelectionProcessStatus {
  INTERESTED = "INTERESTED",
  PREPARING_APPLICATION = "PREPARING_APPLICATION",
  APPLICATION_SUBMITTED = "APPLICATION_SUBMITTED",
  ADMITTED = "ADMITTED",
  EXCLUDED = "EXCLUDED",
  EXAM_PENDING = "EXAM_PENDING",
  EXAM_COMPLETED = "EXAM_COMPLETED",
  COMPLETED = "COMPLETED",
}
```

Correspondencia visible:

| Estado técnico | Texto visible |
|---|---|
| `INTERESTED` | Me interesa |
| `PREPARING_APPLICATION` | Preparando solicitud |
| `APPLICATION_SUBMITTED` | Solicitud presentada |
| `ADMITTED` | Admitido |
| `EXCLUDED` | Excluido |
| `EXAM_PENDING` | Examen pendiente |
| `EXAM_COMPLETED` | Examen realizado |
| `COMPLETED` | Finalizado |

---

## 6. Reglas de dominio

### 6.1. Estado inicial

Al seguir una convocatoria por primera vez:

```text
personalStatus = INTERESTED
```

### 6.2. Cambios de estado

El usuario puede cambiar libremente entre los estados personales.

No se fuerza un flujo rígido como:

```text
INTERESTED
  ↓
PREPARING_APPLICATION
  ↓
APPLICATION_SUBMITTED
```

Esto es intencionado, ya que la situación real de un opositor puede requerir saltos o correcciones.

### 6.3. Mismo estado

Si se solicita cambiar al estado que ya tiene:

```text
no se guarda nada
no cambia personalStatusUpdatedAt
no cambia updatedAt
```

### 6.4. Cambio real de estado

Cuando el estado cambia:

```text
personalStatus
        ↓
nuevo estado

personalStatusUpdatedAt
        ↓
fecha actual

updatedAt
        ↓
actualización automática de Prisma
```

`followedAt` no cambia.

### 6.5. Independencia respecto a CIDO

El estado personal es independiente del estado oficial.

Ejemplo:

```text
Estado oficial CIDO:
En proceso

Estado personal:
Examen realizado
```

Ambos pueden coexistir.

---

## 7. Modelo Prisma

Se añade el enum Prisma:

```prisma
enum PersonalSelectionProcessStatus {
  INTERESTED
  PREPARING_APPLICATION
  APPLICATION_SUBMITTED
  ADMITTED
  EXCLUDED
  EXAM_PENDING
  EXAM_COMPLETED
  COMPLETED
}
```

Modelo:

```prisma
model UserSelectionProcess {
  id                      Int                            @id @default(autoincrement())
  userId                  String                         @map("user_id")
  selectionProcessId      Int                            @map("selection_process_id")
  personalStatus          PersonalSelectionProcessStatus @default(INTERESTED) @map("personal_status")
  followedAt              DateTime                       @default(now()) @map("followed_at")
  personalStatusUpdatedAt DateTime                       @default(now()) @map("personal_status_updated_at")
  updatedAt               DateTime                       @updatedAt @map("updated_at")

  user             User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  selectionProcess SelectionProcess @relation(fields: [selectionProcessId], references: [id], onDelete: Cascade)

  @@unique([userId, selectionProcessId])
  @@index([selectionProcessId])
  @@map("user_selection_processes")
}
```

Relaciones añadidas:

```prisma
userSelectionProcesses UserSelectionProcess[]
```

en:

```text
User
SelectionProcess
```

---

## 8. Reglas de persistencia

### Restricción única

Un usuario no puede seguir dos veces simultáneamente la misma convocatoria:

```text
UNIQUE(userId, selectionProcessId)
```

### Eliminación de usuario

```text
User eliminado
    ↓
CASCADE
    ↓
se eliminan sus seguimientos
```

### Eliminación de convocatoria

```text
SelectionProcess eliminado
    ↓
CASCADE
    ↓
se eliminan sus relaciones personales
```

### Convocatoria desactivada en CIDO

Si:

```text
sourceActive = false
```

la convocatoria **continúa apareciendo** en `Mis convocatorias`.

Esto permite conservar el histórico personal aunque la convocatoria ya no forme parte del conjunto activo sincronizado desde CIDO.

---

## 9. Repositorio de dominio

Contrato:

```ts
export interface UserSelectionProcessRepository {
  findByUserAndSelectionProcess(
    userId: string,
    selectionProcessId: number,
  ): Promise<UserSelectionProcess | null>;

  save(
    userSelectionProcess: UserSelectionProcess,
  ): Promise<UserSelectionProcess>;

  deleteByUserAndSelectionProcess(
    userId: string,
    selectionProcessId: number,
  ): Promise<void>;
}
```

El repositorio de dominio está dedicado a operaciones sobre la entidad.

La consulta de `Mis convocatorias` no se añade a este contrato.

---

## 10. Separación Command / Query

Para obtener la lista enriquecida de `Mis convocatorias` se utiliza un repositorio de consulta separado:

```ts
export interface UserSelectionProcessQueryRepository {
  findByUser(
    userId: string,
  ): Promise<UserSelectionProcessListItem[]>;
}
```

Esto evita contaminar el repositorio de dominio con consultas específicas de presentación.

Arquitectura:

```text
Domain Repository
    ↓
guardar / buscar relación / eliminar

Query Repository
    ↓
leer lista enriquecida de Mis convocatorias
```

---

## 11. Casos de uso

Se implementan:

```text
FollowSelectionProcess
UnfollowSelectionProcess
ChangeSelectionProcessPersonalStatus
GetUserSelectionProcess
ListUserSelectionProcesses
```

---

## 12. FollowSelectionProcess

Responsabilidad:

```text
usuario + convocatoria
        ↓
comprobar si ya existe seguimiento
        ↓
si existe → devolverlo
si no existe → crear relación INTERESTED
```

La operación es idempotente.

Pulsar varias veces “Seguir convocatoria” no crea duplicados.

---

## 13. UnfollowSelectionProcess

Responsabilidad:

```text
usuario + convocatoria
        ↓
eliminar relación
```

La implementación Prisma utiliza `deleteMany`:

```ts
async deleteByUserAndSelectionProcess(
  userId: string,
  selectionProcessId: number,
): Promise<void> {
  await this.prisma.userSelectionProcess.deleteMany({
    where: {
      userId,
      selectionProcessId,
    },
  });
}
```

Esto permite que la operación sea idempotente.

---

## 14. ChangeSelectionProcessPersonalStatus

Flujo:

```text
buscar seguimiento
        ↓
¿existe?
   │
   ├── no → error
   │
   └── sí
        ↓
¿nuevo estado = estado actual?
   │
   ├── sí → devolver sin guardar
   │
   └── no
        ↓
actualizar estado
actualizar personalStatusUpdatedAt
guardar
```

Si la convocatoria no está seguida:

```text
"La convocatoria no está en seguimiento."
```

---

## 15. GetUserSelectionProcess

Obtiene la relación entre:

```text
userId
+
selectionProcessId
```

Resultado:

```text
UserSelectionProcessDto
```

o:

```text
null
```

Se utiliza principalmente desde el detalle de convocatoria.

---

## 16. ListUserSelectionProcesses

Devuelve la lista de convocatorias seguidas por el usuario autenticado.

La consulta se realiza mediante:

```text
UserSelectionProcessQueryRepository
```

y no mediante el repositorio de dominio.

---

## 17. DTO principal

```text
UserSelectionProcessDto
```

Campos:

```text
id
userId
selectionProcessId
personalStatus
followedAt
personalStatusUpdatedAt
updatedAt
```

---

## 18. Read model de “Mis convocatorias”

La consulta devuelve información ya preparada para la interfaz.

Estructura principal:

```text
UserSelectionProcessListItem
├── id
├── personalStatus
├── followedAt
├── personalStatusUpdatedAt
└── selectionProcess
    ├── id
    ├── cidoIdentifier
    ├── title
    ├── isJobPool
    ├── statusId
    ├── status
    ├── applicationStartDate
    ├── applicationEndDate
    ├── qualificationGroup
    ├── numberOfPositions
    ├── personnelType
    ├── selectionSystem
    ├── scope
    ├── reservedPlaces
    ├── sourceActive
    ├── cidoUrl
    ├── latestDocument
    └── institution
```

---

## 19. Query Prisma de “Mis convocatorias”

La consulta:

- filtra por `userId`;
- incluye `selectionProcess`;
- incluye `institution`;
- incluye el último documento activo;
- ordena por `followedAt DESC`;
- no filtra la convocatoria por `sourceActive`.

Orden:

```text
seguimiento más reciente
        ↓
seguimiento más antiguo
```

---

## 20. Último documento oficial

Para cada convocatoria se consulta:

```text
documents
```

con:

```text
sourceActive = true
```

y orden:

```text
publicationDate DESC
id DESC
```

tomando:

```text
take: 1
```

Esto evita consultas N+1 y garantiza un único documento.

Resultado:

```text
latestDocument
├── publicationDate
├── documentUrl
└── htmlUrl
```

Si no existe ningún documento activo:

```text
latestDocument = null
```

---

## 21. Composition root

Los repositorios y casos de uso se montan en:

```text
src/composition/user-selection-process.ts
```

Se mantienen separados:

```text
PrismaUserSelectionProcessRepository
        ↓
casos de uso de dominio

PrismaUserSelectionProcessQueryRepository
        ↓
ListUserSelectionProcesses
```

---

## 22. Seguridad y sesión

El cliente nunca envía un `userId` de confianza.

El usuario se obtiene siempre desde Better Auth:

```text
request
   ↓
session
   ↓
session.user.id
```

Por tanto:

```text
userId del formulario
```

no se utiliza.

Si no existe sesión:

```text
redirect → /login
```

con `returnTo` hacia la página correspondiente.

---

## 23. Integración en detalle de convocatoria

Ruta:

```text
/convocatorias/[id]
```

El detalle consulta:

```text
GetUserSelectionProcess
```

si existe una sesión.

### Usuario no autenticado

Puede consultar la convocatoria, pero para seguirla debe iniciar sesión.

### Usuario autenticado sin seguimiento

Se muestra la opción:

```text
Seguir convocatoria
```

### Usuario autenticado con seguimiento

Se muestra un bloque destacado:

```text
SEGUIMIENTO PERSONAL

Estado personal actual

[ Cambiar estado ]

Último cambio:
10/10/2026, 14:37:52

Tu estado personal.
No modifica el estado oficial de la convocatoria.

Dejar de seguir
```

---

## 24. Estado oficial vs seguimiento personal

El lateral del detalle diferencia visualmente dos conceptos.

### Estado oficial CIDO

Muestra:

```text
Estado oficial CIDO
estado publicado por CIDO
Ver convocatoria oficial
```

El botón **Convocatoria oficial** se integra directamente en este card.

Se elimina el card independiente de `Acciones`.

También se elimina temporalmente:

```text
Presentar solicitud
```

La solicitud oficial se abordará posteriormente con información estructurada más fiable.

### Seguimiento personal

Tiene mayor peso visual y aparece inmediatamente debajo del estado oficial.

---

## 25. Selector gráfico de estado personal

Componente reutilizable:

```text
PersonalSelectionProcessStatusPicker
```

Ruta:

```text
src/modules/user-selection-process/presentation/
personal-selection-process-status-picker.tsx
```

Se utiliza en:

```text
Detalle de convocatoria
Mis convocatorias
```

El usuario pulsa:

```text
Cambiar estado
```

y se abre un modal con las ocho opciones.

Cada estado muestra:

- icono;
- nombre;
- descripción;
- indicación del estado actual.

El estado se guarda al seleccionar una opción.

---

## 26. Cierre automático del modal

Al seleccionar un nuevo estado:

```text
selección
   ↓
onSubmit
   ↓
setIsOpen(false)
   ↓
server action
   ↓
revalidación
```

De esta forma el modal desaparece inmediatamente mientras se procesa el cambio.

---

## 27. Variante embedded del selector

El componente admite presentación integrada para el detalle.

En modo `embedded`:

```text
icono + nombre completo del estado

[ Cambiar estado ]
```

El botón aparece debajo del estado para evitar truncar textos como:

```text
Preparando solicitud
Solicitud presentada
Examen realizado
```

---

## 28. Fecha del último cambio

En el detalle se muestra:

```text
día / mes / año
hora : minuto : segundo
```

Ejemplo:

```text
10/10/2026, 14:37:52
```

Se formatea con:

```text
locale: es-ES
timeZone: Europe/Madrid
```

La fecha representa un instante real, por lo que se convierte a la hora local de Catalunya.

---

## 29. Página “Mis convocatorias”

Ruta protegida:

```text
/mis-convocatorias
```

Sin sesión:

```text
redirect → /login?returnTo=/mis-convocatorias
```

Con sesión:

```text
session.user.id
        ↓
ListUserSelectionProcesses
        ↓
cards personales
```

---

## 30. Diseño de “Mis convocatorias”

La versión final utiliza:

```text
2 columnas en escritorio
cards compactos
alta densidad de información útil
```

Cada card muestra principalmente:

- título;
- municipio;
- comarca;
- tipo de convocatoria;
- estado oficial;
- situación del plazo;
- días pendientes de solicitud;
- reservas especiales;
- último documento activo;
- fecha de publicación del último documento;
- estado personal;
- fecha desde que se sigue;
- fecha del último cambio de estado;
- acciones.

---

## 31. Acciones de cada card

En la parte inferior:

```text
Dejar de seguir
```

en rojo.

A la derecha:

```text
Ver detalle
Ver convocatoria oficial
```

`Ver detalle` es la acción principal de navegación dentro de Convoca'm.

`Ver convocatoria oficial` abre CIDO.

---

## 32. Información deliberadamente no mostrada en “Mis convocatorias”

Para mantener una vista compacta no se muestran en los cards:

- organismo;
- provincia;
- número de plazas;
- grupo de titulación;
- tipo de personal;
- sistema de selección;
- ámbito;
- tipo de contrato;
- materias;
- expediente;
- año de oferta pública;
- identificador CIDO;
- dirección;
- mapa;
- email;
- teléfono;
- enlace directo para presentar solicitud.

Esta información sigue estando disponible en el detalle cuando corresponde.

---

## 33. Jornada

El campo de jornada se valoró para `Mis convocatorias`.

Actualmente no existe de forma fiable en el modelo sincronizado desde CIDO.

Decisión:

```text
no inventar el dato
```

Se pospone para una fase posterior, previsiblemente mediante extracción estructurada de documentos oficiales.

---

## 34. Server Actions

Se implementan acciones desde:

```text
src/app/convocatorias/[id]/actions.ts
src/app/mis-convocatorias/actions.ts
```

Operaciones:

```text
seguir
dejar de seguir
cambiar estado personal
```

Todas:

1. validan identificadores;
2. validan el estado cuando corresponde;
3. obtienen la sesión;
4. usan `session.user.id`;
5. ejecutan el caso de uso;
6. revalidan las rutas afectadas.

---

## 35. Revalidación entre vistas

Después de modificar el seguimiento desde el detalle:

```text
revalidatePath(
  `/convocatorias/${selectionProcessId}`,
)

revalidatePath(
  "/mis-convocatorias",
)
```

De esta forma ambas pantallas permanecen sincronizadas.

Desde `Mis convocatorias` también se revalida el detalle correspondiente.

---

## 36. Componentes reutilizables

### Estado personal

```text
PersonalSelectionProcessStatusPicker
```

Se comparte entre:

```text
detalle
Mis convocatorias
```

### Dejar de seguir

```text
UnfollowSelectionProcessForm
```

Incluye modal de confirmación.

El botón `Dejar de seguir` utiliza tratamiento visual rojo para reflejar que se trata de una acción destructiva.

---

## 37. Presentación de estados personales

Existe una capa de presentación específica:

```text
src/modules/user-selection-process/presentation/
personal-selection-process-status.ts
```

Responsabilidad:

```text
enum técnico
    ↓
texto visible en castellano
```

La UI no utiliza directamente los nombres técnicos del enum.

---

## 38. Tests de dominio

La entidad `UserSelectionProcess` dispone de tests para:

- creación válida;
- estado inicial;
- restauración;
- validación de campos;
- cambio de estado;
- actualización de fecha;
- conservación de `followedAt`;
- no-op cuando se asigna el mismo estado.

---

## 39. Test de ListUserSelectionProcesses

Se comprueba que:

```text
userId
   ↓
UserSelectionProcessQueryRepository.findByUser(userId)
```

devuelve la lista del usuario.

También se verifica:

```text
usuario sin seguimientos
        ↓
[]
```

---

## 40. Test de integración del Query Repository

Se utiliza PostgreSQL de test.

Se verifica:

### 40.1. Aislamiento por usuario

Un usuario solo recibe sus propios seguimientos.

### 40.2. Orden

```text
followedAt DESC
```

### 40.3. Históricos

Una convocatoria seguida con:

```text
sourceActive = false
```

sigue apareciendo.

### 40.4. Institución

Se recupera correctamente:

```text
name
municipality
county
province
```

### 40.5. Último documento

Se selecciona el documento activo más reciente.

### 40.6. Documentos inactivos

Un documento más reciente con:

```text
sourceActive = false
```

se ignora.

### 40.7. Sin documentos

Si no existen documentos activos:

```text
latestDocument = null
```

---

## 41. Cliente Prisma en tests

El proyecto utiliza el cliente Prisma compartido configurado por la aplicación.

Los tests no crean:

```ts
new PrismaClient()
```

directamente.

Se reutiliza:

```ts
import { prisma } from "@/shared/infrastructure/database/prisma";
```

Esto respeta la configuración actual del adaptador PostgreSQL.

---

## 42. Base de datos de test

Los tests de integración se ejecutan con:

```text
.env.test
```

Flujo:

```bash
set -a
source .env.test
set +a

pnpm exec prisma migrate deploy
pnpm exec vitest run
```

Después de finalizar:

```bash
unset DATABASE_URL
```

para evitar iniciar accidentalmente la aplicación de desarrollo contra la base de datos de test.

---

## 43. Resultado final de tests

Al cierre de SPEC-006:

```text
18 archivos de test → OK
69 tests → OK
```

Además:

```bash
pnpm exec tsc --noEmit
```

finaliza sin errores.

---

## 44. Estructura principal añadida

```text
src/
├── app/
│   ├── convocatorias/
│   │   └── [id]/
│   │       ├── page.tsx
│   │       └── actions.ts
│   │
│   └── mis-convocatorias/
│       ├── page.tsx
│       └── actions.ts
│
├── composition/
│   └── user-selection-process.ts
│
└── modules/
    └── user-selection-process/
        ├── domain/
        │   ├── personal-selection-process-status.ts
        │   ├── user-selection-process.ts
        │   ├── user-selection-process-repository.ts
        │   └── user-selection-process.test.ts
        │
        ├── application/
        │   ├── follow-selection-process.ts
        │   ├── unfollow-selection-process.ts
        │   ├── change-selection-process-personal-status.ts
        │   ├── get-user-selection-process.ts
        │   ├── list-user-selection-processes.ts
        │   ├── user-selection-process-query-repository.ts
        │   ├── user-selection-process-list-item.ts
        │   └── ...
        │
        ├── infrastructure/
        │   └── prisma/
        │       ├── prisma-user-selection-process-repository.ts
        │       ├── prisma-user-selection-process-query-repository.ts
        │       └── prisma-user-selection-process-query-repository.test.ts
        │
        └── presentation/
            ├── personal-selection-process-status.ts
            ├── personal-selection-process-status-picker.tsx
            └── unfollow-selection-process-form.tsx
```

---

## 45. Flujo funcional final

```text
BUSCADOR
   ↓
DETALLE CONVOCATORIA
   ↓
Seguir convocatoria
   ↓
UserSelectionProcess
   ↓
Mi estado = Me interesa
   ↓
Cambiar estado
   ↓
Preparando solicitud
Solicitud presentada
Admitido
Excluido
Examen pendiente
Examen realizado
Finalizado
   ↓
MIS CONVOCATORIAS
```

---

## 46. Flujo arquitectónico

### Escritura

```text
Next.js Server Action
        ↓
Application Use Case
        ↓
Domain Entity
        ↓
UserSelectionProcessRepository
        ↓
Prisma
        ↓
PostgreSQL
```

### Lectura de Mis convocatorias

```text
Next.js Page
        ↓
ListUserSelectionProcesses
        ↓
UserSelectionProcessQueryRepository
        ↓
Prisma
        ↓
PostgreSQL
```

---

## 47. Criterios de aceptación finales

- [x] Un usuario autenticado puede seguir una convocatoria.
- [x] Seguir dos veces no duplica la relación.
- [x] Un usuario puede dejar de seguirla.
- [x] Dejar de seguir es idempotente.
- [x] Al seguir se asigna `INTERESTED`.
- [x] El usuario puede cambiar libremente su estado personal.
- [x] El mismo estado no modifica timestamps.
- [x] `followedAt` no cambia al modificar el estado.
- [x] Estado oficial y personal son independientes.
- [x] `userId` procede siempre de sesión.
- [x] `/mis-convocatorias` requiere autenticación.
- [x] Solo se muestran las convocatorias del usuario.
- [x] Las convocatorias históricas seguidas siguen visibles.
- [x] Se muestra el último documento oficial activo.
- [x] Se ignoran documentos inactivos.
- [x] La lista se ordena por seguimiento más reciente.
- [x] Detalle y Mis convocatorias quedan sincronizados.
- [x] El selector gráfico de estado es reutilizable.
- [x] El modal se cierra al seleccionar un estado.
- [x] El estado completo es legible en el detalle.
- [x] Se muestra fecha y hora del último cambio personal.
- [x] TypeScript compila sin errores.
- [x] 18 archivos de test pasan.
- [x] 69 tests pasan.

---

## 48. Estado final

```text
SPEC-006 — Seguimiento personal de convocatorias
y Mis convocatorias

✅ FINALIZADA
```

La funcionalidad ya forma parte estable del núcleo de Convoca'm y deja preparado el proyecto para evolucionar hacia funcionalidades posteriores como recordatorios, tareas, avisos, extracción de información de documentos oficiales y asistencia personalizada al opositor.
