# PRD — Roles y responsabilidades del MVP de Dentamax

## 1. Objetivo

Definir los roles, responsabilidades, permisos y reglas de acceso de los usuarios internos de Dentamax.

El MVP contará con tres roles:

* `owner`
* `assistant`
* `dentist`

Dentamax utilizará una organización como representación del negocio dental. Una organización podrá contener múltiples clínicas o sucursales.

## 2. Modelo organizacional

```text
Organization
├── Members
│   ├── Owner
│   ├── Assistants
│   └── Dentists
└── Clinics
```

La organización es propietaria de:

* Clínicas.
* Miembros.
* Pacientes.
* Expedientes.
* Servicios.
* Recetas.
* Configuración fiscal futura.
* Información administrativa compartida.

Las citas, horarios y configuraciones operativas pertenecen a una clínica específica.

## 3. Principios generales

* Todo usuario debe pertenecer a una organización mediante una membresía.
* Cada membresía debe tener un único rol principal.
* Los roles se asignan dentro de la organización.
* El acceso operativo puede limitarse a clínicas específicas.
* Un usuario no puede acceder a información de otra organización.
* Los permisos deben validarse en el servidor.
* Las acciones relevantes deben registrar usuario, fecha y hora.
* Los pacientes y expedientes pertenecen a la organización, no a una clínica ni a un dentista.
* Las citas siempre deben estar asociadas con una clínica.
* Las notas clínicas y recetas deben conservar al dentista autor.

## 4. Rol Owner

### 4.1 Propósito

Representa al propietario o responsable principal del negocio dental.

El usuario que crea la organización recibe automáticamente el rol `owner`.

### 4.2 Permisos

El Owner puede:

* Consultar y modificar la configuración de la organización.
* Crear, editar y desactivar clínicas.
* Consultar todas las clínicas.
* Invitar miembros.
* Asignar roles.
* Cambiar los roles de miembros existentes.
* Desactivar o eliminar miembros.
* Asignar asistentes y dentistas a clínicas.
* Administrar servicios.
* Consultar todos los pacientes.
* Consultar todos los expedientes.
* Consultar todas las citas.
* Configurar WhatsApp y recordatorios.
* Consultar reportes globales.
* Gestionar posteriormente suscripción y datos fiscales.

El Owner puede realizar también todas las acciones permitidas al rol `assistant`.

### 4.3 Restricciones

El Owner no puede:

* Emitir recetas en nombre de un dentista.
* Modificar notas clínicas creadas por dentistas.
* Eliminar permanentemente expedientes o registros clínicos.
* Suplantar la identidad de otro miembro.

## 5. Rol Assistant

### 5.1 Propósito

Administrar la operación diaria de las clínicas asignadas.

### 5.2 Asignación

Un Assistant debe estar asignado a una o varias clínicas.

Solo podrá operar dentro de esas clínicas.

### 5.3 Permisos

El Assistant puede:

* Consultar las clínicas asignadas.
* Recibir solicitudes de citas desde WhatsApp.
* Aprobar o rechazar solicitudes.
* Crear citas manualmente.
* Reprogramar y cancelar citas.
* Asignar citas a dentistas.
* Consultar la agenda de las clínicas asignadas.
* Administrar horarios operativos.
* Registrar pacientes.
* Actualizar información administrativa de pacientes.
* Consultar expedientes cuando sea necesario para la operación.
* Consultar recetas existentes.
* Administrar servicios disponibles en las clínicas asignadas.
* Supervisar confirmaciones y recordatorios.
* Marcar citas como completadas, canceladas o no asistidas.

### 5.4 Restricciones

El Assistant no puede:

* Crear o eliminar la organización.
* Transferir la propiedad.
* Administrar la suscripción.
* Modificar al Owner.
* Acceder a clínicas no asignadas.
* Emitir recetas.
* Crear diagnósticos.
* Modificar notas clínicas.
* Modificar recetas emitidas.
* Eliminar expedientes.

## 6. Rol Dentist

### 6.1 Propósito

Atender citas asignadas y registrar la información clínica generada durante la atención.

### 6.2 Asignación

Un Dentist debe:

* Pertenecer a la organización.
* Tener asignada una o varias clínicas.
* Contar con un perfil profesional.

Su perfil podrá contener:

* Nombre profesional.
* Cédula profesional.
* Especialidades.
* Servicios autorizados.
* Horarios y disponibilidad.

### 6.3 Permisos

El Dentist puede:

* Consultar sus citas asignadas.
* Consultar su agenda por clínica.
* Consultar pacientes con relación asistencial.
* Registrar pacientes.
* Consultar expedientes autorizados.
* Crear notas clínicas.
* Registrar antecedentes y alergias.
* Registrar diagnósticos.
* Registrar procedimientos.
* Crear tratamientos.
* Dar seguimiento a tratamientos.
* Adjuntar archivos clínicos.
* Crear recetas.
* Consultar sus recetas anteriores.
* Marcar sus citas como iniciadas, completadas o no asistidas.

Existe relación asistencial cuando:

* Tiene una cita asignada con el paciente.
* Atendió anteriormente al paciente.
* Tiene un tratamiento activo con el paciente.

### 6.4 Restricciones

El Dentist no puede:

* Consultar todos los pacientes de la organización.
* Acceder a pacientes sin relación asistencial.
* Consultar agendas de otros dentistas.
* Aprobar solicitudes de citas.
* Asignar citas a otros dentistas.
* Crear o modificar clínicas.
* Administrar miembros.
* Administrar servicios generales.
* Modificar notas de otros dentistas.
* Eliminar permanentemente registros clínicos.
* Emitir recetas en nombre de otro dentista.

## 7. Asignación de miembros a clínicas

La pertenencia a la organización y la asignación a clínicas son relaciones diferentes.

```text
OrganizationMember
├── organizationId
├── userId
└── role

ClinicAssignment
├── clinicId
├── memberId
└── status
```

Reglas:

* El Owner tiene acceso automático a todas las clínicas.
* Un Assistant solo accede a clínicas asignadas.
* Un Dentist solo opera en clínicas asignadas.
* Desasignar una clínica no elimina el historial del miembro.
* Las citas futuras del Dentist deberán reasignarse antes de desactivarlo.

## 8. Flujo de invitación

```text
Owner selecciona “Invitar miembro”
→ captura correo
→ asigna rol
→ selecciona clínicas
→ se envía invitación
→ el usuario se registra o inicia sesión
→ acepta la invitación
→ se crea su membresía
→ se aplican las asignaciones
```

Si el rol es `dentist`, el sistema debe solicitar la creación del perfil profesional.

## 9. Matriz resumida

| Acción                   | Owner |            Assistant |              Dentist |
| ------------------------ | ----: | -------------------: | -------------------: |
| Administrar organización |    Sí |                   No |                   No |
| Crear clínicas           |    Sí |                   No |                   No |
| Invitar miembros         |    Sí |                   No |                   No |
| Administrar citas        |    Sí |        Sí, asignadas |         Solo propias |
| Registrar pacientes      |    Sí |                   Sí |                   Sí |
| Ver todos los pacientes  |    Sí | Limitado por clínica |                   No |
| Consultar expedientes    |    Sí |            Operativo | Relación asistencial |
| Crear notas clínicas     |    No |                   No |                   Sí |
| Crear recetas            |    No |                   No |                   Sí |
| Administrar servicios    |    Sí |          Por clínica |                   No |
| Configurar WhatsApp      |    Sí |            Operativo |                   No |

## 10. Regla final

El Owner administra el negocio completo, los Assistants administran la operación de las clínicas asignadas y los Dentists administran la atención clínica de sus pacientes relacionados.
