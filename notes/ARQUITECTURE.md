# ARQUITECTURE.md

## Propósito

Este documento define la arquitectura de **Dentamax**, una plataforma para clínicas dentales enfocada en mejorar la experiencia del paciente.

Dentistas y asistentes administrarán pacientes, citas, expedientes, tratamientos y recetas desde la plataforma. Los pacientes podrán consultar información y realizar acciones mediante WhatsApp.

El agente debe leer este documento antes de crear, modificar o reorganizar código.

---

## Stack principal

* TypeScript.
* React.
* TanStack Start.
* TanStack Router.
* TanStack Query.
* TanStack Form.
* TanStack Store cuando sea necesario.
* TanStack AI para funcionalidades de inteligencia artificial.
* Drizzle ORM.
* PostgreSQL.
* Better Auth.
* Zod para validación.

No introducir alternativas al stack principal sin una justificación técnica clara.

---

## Enfoque arquitectónico

Dentamax debe implementarse inicialmente como un **monolito modular full-stack**.

La aplicación se organiza por funcionalidades del negocio, no por categorías técnicas globales.

Ejemplos de módulos:

* `auth`
* `clinics`
* `members`
* `patients`
* `appointments`
* `clinicalRecords`
* `prescriptions`
* `treatments`
* `whatsapp`
* `notifications`
* `audit`

Cada módulo debe contener su interfaz, lógica de servidor, validaciones, tipos y servicios relacionados.

---

## Estructura general

```text
src/
├── routes/
├── modules/
│   ├── auth/
│   ├── clinics/
│   ├── patients/
│   ├── appointments/
│   ├── clinicalRecords/
│   ├── prescriptions/
│   ├── treatments/
│   ├── whatsapp/
│   └── audit/
├── shared/
│   ├── components/
│   │   └── ui/
│   ├── database/
│   ├── errors/
│   ├── lib/
│   ├── server/
│   └── types/
├── config/
└── env.ts
```

### `routes`

Contiene las rutas de TanStack Router.

Las rutas deben limitarse a:

* Definir URLs y layouts.
* Validar parámetros.
* Ejecutar loaders.
* Proteger secciones.
* Componer páginas.

No colocar lógica de negocio extensa dentro de las rutas.

### `modules`

Contiene las funcionalidades principales del negocio.

### `shared`

Contiene código verdaderamente transversal y reutilizable.

No mover código a `shared` únicamente porque se utilice dos veces. Debe representar una abstracción estable y no pertenecer claramente a un módulo.

### `config`

Contiene configuración estática, constantes globales e integraciones.

### `env.ts`

Centraliza y valida las variables de entorno.

No acceder directamente a `process.env` desde los módulos.

---

## Estructura de un módulo

```text
src/modules/patients/
├── components/
├── server/
├── services/
├── schemas/
├── types/
├── lib/
└── index.ts
```

No crear directorios vacíos.

### `components`

Componentes React específicos del módulo.

No deben acceder directamente a la base de datos ni contener reglas críticas del negocio.

### `server`

Código exclusivo del servidor:

* Server functions.
* Consultas de Drizzle.
* Autenticación y autorización.
* Operaciones de base de datos.
* Integraciones privadas.

### `services`

Casos de uso o procesos que coordinan varias operaciones.

Ejemplos:

* Registrar un paciente.
* Crear una cita y enviar una notificación.
* Procesar un mensaje de WhatsApp.
* Emitir una receta y registrar auditoría.

### `schemas`

Schemas de Zod para validar formularios, parámetros y contratos.

### `types`

Tipos que no puedan inferirse correctamente desde Zod, Drizzle o funciones existentes.

Evitar duplicar tipos inferibles.

### `lib`

Funciones puras y específicas del módulo.

### `index.ts`

Define la API pública del módulo.

Otros módulos deben evitar importar implementaciones internas directamente.

---

## Dependencias

La dirección general debe ser:

```text
routes → modules → shared
```

`shared` nunca debe depender de módulos concretos.

Las dependencias entre módulos están permitidas cuando representan relaciones reales del negocio, pero deben evitarse ciclos.

Un módulo debe consumir la API pública de otro módulo y no sus archivos internos.

---

## Multi-tenancy

Dentamax es una plataforma para múltiples clínicas.

Todos los datos pertenecientes a una clínica deben estar asociados a un `clinicId`.

Esto incluye:

* Pacientes.
* Citas.
* Expedientes.
* Recetas.
* Tratamientos.
* Miembros.
* Mensajes.
* Auditoría.

Toda consulta y mutación debe filtrar por la clínica activa.

El `clinicId` debe obtenerse desde la sesión autenticada y nunca confiarse directamente desde el cliente.

---

## Autenticación y autorización

Better Auth administra identidad y sesiones.

La autorización debe verificar qué puede hacer un usuario dentro de una clínica.

Roles iniciales:

* `owner`
* `admin`
* `dentist`
* `assistant`

Las funciones protegidas deben resolver un contexto similar a:

```ts
type AuthContext = {
  userId: string
  clinicId: string
  membershipId: string
  role: ClinicRole
}
```

Los permisos deben centralizarse mediante funciones explícitas.

```ts
canManageMembers(context)
canEditClinicalRecord(context)
canCreatePrescription(context)
```

Ocultar una acción en la interfaz no reemplaza la autorización del servidor.

---

## Drizzle y PostgreSQL

Cada módulo es propietario de sus tablas.

```text
modules/patients/server/database/
├── patientTable.ts
├── patientRelations.ts
└── patientRepository.ts
```

El schema central solamente agrega y exporta las tablas de los módulos.

Las tablas deben incluir cuando corresponda:

* `id`
* `clinicId`
* `createdAt`
* `updatedAt`
* `createdBy`
* `archivedAt`

Utilizar claves foráneas, restricciones e índices.

Usar transacciones cuando varias operaciones deban completarse como una sola unidad.

No crear repositorios genéricos por defecto. Preferir funciones con intención de dominio.

```ts
findPatientForClinic()
listUpcomingAppointments()
archivePatient()
```

---

## TanStack

### Router

Usar search params validados para filtros, paginación y vistas compartibles.

### Query

TanStack Query administra estado remoto.

No duplicar sus datos dentro de TanStack Store o estado local sin necesidad.

Las query keys deben estar centralizadas por módulo e incluir el contexto necesario para evitar mezclar datos entre clínicas.

### Form

TanStack Form administra formularios complejos.

Toda entrada debe volver a validarse en el servidor.

### Store

TanStack Store se utiliza únicamente para estado global del cliente que no sea estado remoto.

Ejemplos:

* Estado de un wizard.
* Preferencias temporales.
* Clínica seleccionada.
* Paneles globales.

---

## WhatsApp

El módulo `whatsapp` debe encapsular completamente al proveedor externo.

El resto de la aplicación no debe depender directamente de su SDK.

Los webhooks deben:

* Verificar firmas.
* Validar payloads.
* Ser idempotentes.
* Evitar duplicados.
* Responder rápidamente.
* Delegar procesos largos cuando sea necesario.

---

## Seguridad y datos clínicos

Los expedientes, recetas y conversaciones contienen información sensible.

El agente debe:

* Aplicar autorización en el servidor.
* Seleccionar únicamente las columnas necesarias.
* Evitar datos clínicos en logs.
* Mantener secretos fuera del repositorio.
* Registrar acciones críticas en auditoría.
* Validar archivos, webhooks y respuestas externas.

No exponer stack traces, SQL, tokens ni mensajes internos de PostgreSQL al cliente.

---

## Convenciones

* Componentes React: `PascalCase`.
* Tipos, interfaces y clases: `PascalCase`.
* Variables y funciones: `camelCase`.
* Hooks: `useCamelCase`.
* Directorios: `camelCase`.
* Constantes globales: `UPPER_SNAKE_CASE`.
* Preferir exportaciones nombradas.
* Una función principal por archivo.
* Evitar archivos genéricos como `helpers.ts`, `utils.ts` o `services.ts`.

Ejemplos:

```text
PatientCard.tsx
createPatient.ts
patientQueryKeys.ts
MAX_APPOINTMENTS_PER_DAY
```

---

## Reglas para el agente

Antes de implementar una tarea:

1. Identificar el módulo propietario.
2. Revisar el código existente.
3. Reutilizar contratos y componentes.
4. Mantener separadas las fronteras cliente-servidor.
5. Validar toda entrada externa.
6. Comprobar autenticación, clínica y permisos.
7. Evitar información sensible en logs.
8. Mantener archivos pequeños.
9. Añadir pruebas para comportamiento crítico.

El agente no debe:

* Introducir nuevas capas sin necesidad.
* Acceder directamente a `process.env`.
* Consultar datos sin filtrar por clínica.
* Colocar lógica de negocio en componentes visuales.
* Confiar únicamente en validación del cliente.
* Introducir `any` para evitar resolver tipos.
* Duplicar tipos inferibles.
* Cambiar el stack principal sin justificación.

---

## Principio final

Priorizar, en este orden:

1. Seguridad de la información clínica.
2. Aislamiento entre clínicas.
3. Corrección de las reglas del negocio.
4. Claridad del código.
5. Experiencia del paciente.
6. Mantenibilidad.
7. Rendimiento.

Cuando una abstracción compleja entre en conflicto con una solución clara y segura, elegir la solución clara y segura.
