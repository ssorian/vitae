# PRD — Gestión de tratamientos, cotizaciones y financiamiento

## 1. Contexto

Dentamax es una plataforma para clínicas dentales con múltiples sucursales. El catálogo de servicios aislados no cubre tratamientos extensos como ortodoncia, prótesis, endodoncia o implantología, donde existen diagnósticos, fases, procedimientos repetitivos, cambios clínicos, cotizaciones, descuentos y pagos diferidos.

Este módulo debe convertir una valoración clínica en un tratamiento trazable, cotizable y administrable, manteniendo separadas la evolución médica y la información financiera.

## 2. Objetivo

Permitir que la clínica pueda:

- Registrar una consulta diagnóstica variable.
- Crear tratamientos personalizados desde plantillas o desde cero.
- Organizar procedimientos por fases y darles seguimiento.
- Generar cotizaciones versionadas con descuentos por concepto.
- Ofrecer planes de pago con tasas configurables.
- Registrar consentimientos, evidencias, pagos y cierre clínico.
- Proporcionar al paciente una vista clara de su tratamiento, próximos pasos y saldo.

## 3. Principios del dominio

```text
Cita → Consulta clínica → Diagnóstico → Tratamiento
     → Cotización → Aceptación → Seguimientos → Cierre
```

Reglas fundamentales:

- La cita reserva tiempo; no define todo lo que se realizará.
- La consulta registra lo ocurrido en una visita.
- Un servicio es una unidad cobrable reutilizable.
- Un procedimiento representa una acción clínica planeada o realizada.
- El tratamiento organiza diagnósticos, fases y procedimientos.
- La cotización congela precios, cantidades y descuentos.
- El financiamiento agrega un cargo sobre el precio de contado.
- El progreso clínico y el financiero son independientes.
- Los documentos clínicos firmados no se sobrescriben.

## 4. Alcance del MVP

### Incluye

- Valoración y consulta clínica.
- Diagnósticos y objetivos clínicos.
- Catálogo de servicios con precio por clínica.
- Plantillas de tratamiento.
- Tratamientos personalizados por paciente.
- Fases, procedimientos y dependencias.
- Notas de evolución por seguimiento.
- Evidencias clínicas y estudios adjuntos.
- Consentimiento informado versionado.
- Cotizaciones versionadas.
- Descuentos porcentuales o fijos por concepto.
- Precio de contado.
- Simulación y aceptación de financiamiento.
- Anticipo y calendario de mensualidades.
- Registro manual de pagos.
- Alta, cancelación, transferencia o pérdida de seguimiento.
- Auditoría de acciones relevantes.

### Fuera de alcance

- Facturación electrónica.
- Pasarela de pagos o cobro automático.
- Interés moratorio y penalizaciones.
- Reestructuración de deuda.
- Inventario de materiales.
- Integración con laboratorios o aseguradoras.
- Firma electrónica avanzada.

## 5. Roles y permisos

### Dentist

- Crear consultas, diagnósticos y notas clínicas.
- Crear y modificar planes de tratamiento.
- Registrar procedimientos, evolución, indicaciones y evidencias.
- Emitir recetas y cerrar clínicamente tratamientos.
- No modificar precios, tasas ni pagos.

### Assistant

- Registrar pacientes y administrar citas de clínicas asignadas.
- Añadir servicios cobrables realizados, sin alterar decisiones clínicas.
- Generar cotizaciones, aplicar descuentos permitidos y registrar pagos.
- Seleccionar planes de financiamiento disponibles.
- No crear diagnósticos ni editar notas clínicas.

### Owner

- Administrar servicios, precios, plantillas y planes financieros.
- Autorizar descuentos o tasas especiales.
- Consultar todas las clínicas de la organización.
- No emitir recetas ni modificar notas clínicas firmadas.

Los permisos deben validarse en servidor y respetar la asignación de miembros a clínicas.

## 6. Flujo de valoración inicial

1. El paciente agenda un tipo de cita, por ejemplo `generalEvaluation`.
2. El asistente realiza check-in.
3. El dentista inicia un `ClinicalEncounter`.
4. La consulta registra motivo, antecedentes relevantes, exploración y signos vitales.
5. El dentista agrega dinámicamente los servicios realizados.
6. Registra uno o varios diagnósticos.
7. La consulta puede terminar sin tratamiento, con un servicio inmediato o con un tratamiento recomendado.

Ejemplos válidos:

```text
Chequeo rápido → consulta general
Chequeo + radiografía → consulta + estudio
Chequeo + limpieza → consulta + limpieza
Diagnóstico complejo → creación de tratamiento
```

## 7. Tratamientos

`PatientTreatment` debe contener como mínimo:

- Paciente, clínica principal y dentista responsable.
- Consulta y diagnóstico de origen.
- Nombre, objetivo clínico y pronóstico.
- Estado y fechas relevantes.
- Fase actual y próximo procedimiento recomendado.
- Versión clínica vigente.

Estados:

```text
draft | proposed | pendingConsent | active | paused
completed | cancelled | abandoned | transferred
```

El tratamiento puede crearse:

- Desde una plantilla.
- Copiando otro plan permitido.
- Desde cero.

La plantilla solo es un punto de partida. Al asignarla a un paciente se copian sus fases y procedimientos para permitir modificaciones sin alterar el catálogo original.

## 8. Fases y procedimientos

Cada tratamiento contiene `TreatmentPhase` ordenadas. Cada fase define un objetivo clínico y procedimientos asociados.

Cada `TreatmentProcedure` debe guardar:

- Servicio relacionado, cuando sea cobrable.
- Descripción congelada.
- Indicación clínica.
- Pieza dental o región.
- Cantidad planeada.
- Dependencias.
- Estado, responsable y fechas.

Estados:

```text
planned | ready | scheduled | inProgress
completed | cancelled | notRequired | blocked
```

Los procedimientos repetitivos pueden definirse como cantidad estimada, por ejemplo `adjustment × 18`. Cada realización crea una instancia clínica vinculada, sin requerir dieciocho registros manuales al crear el plan.

## 9. Seguimiento clínico

Cada atención relacionada con un tratamiento debe generar una `TreatmentFollowUp` o nota de evolución.

Debe registrar:

- Fecha, dentista y cita relacionada.
- Estado actual y evolución.
- Hallazgos, diagnóstico y pronóstico actualizados.
- Procedimientos realizados.
- Complicaciones y respuesta del paciente.
- Estudios interpretados y evidencias.
- Indicaciones, medicamentos y cuidados.
- Próximo paso y fecha recomendada.
- Firma del dentista y conformidad del paciente cuando corresponda.

Al guardar un seguimiento, Dentamax debe:

1. Crear una nota inalterable.
2. Actualizar procedimientos y fase.
3. Relacionar estudios y evidencias.
4. Agregar servicios cobrables, si existen.
5. Definir la próxima acción.
6. Permitir generar la siguiente cita.

Las correcciones posteriores se registran como addendum con autor, fecha y motivo.

## 10. Revisiones y consentimiento

Los cambios clínicos significativos deben crear una `TreatmentRevision` con:

- Versión.
- Justificación clínica.
- Cambios realizados.
- Autor y fecha.
- Indicador de nuevo consentimiento.

El consentimiento no será un booleano. Debe conservar la versión del tratamiento aceptada, descripción de intervención, objetivos, riesgos, beneficios, alternativas, consecuencias de no tratarse, firmas y fecha.

Estados:

```text
draft | pendingSignature | signed | revoked | replaced
```

## 11. Cotización

La cotización se genera después de definir el tratamiento y no forma parte de la nota clínica.

Cada `Estimate` debe tener versión y estados:

```text
draft | sent | accepted | rejected | expired | replaced
```

Los conceptos guardan snapshots de nombre, cantidad y precio. Cambiar el catálogo no altera cotizaciones existentes.

Cálculo:

```text
subtotal = Σ(quantity × unitPrice)
discountTotal = Σ(itemDiscount)
cashTotal = subtotal - discountTotal
```

Los descuentos pueden ser fijos o porcentuales por concepto y deben registrar motivo, usuario y fecha. Una cotización aceptada no puede editarse; cualquier cambio crea otra versión.

## 12. Financiamiento

Los planes se configuran por organización y opcionalmente por clínica.

Ejemplos:

```text
3 meses  → 0.03
6 meses  → 0.07
12 meses → 0.15
```

Para el MVP, la tasa representa un recargo total por el plazo, no una tasa mensual:

```text
financedPrincipal = cashTotal - downPayment
financingCharge = financedPrincipal × financingRate
financedTotal = financedPrincipal + financingCharge
```

La cotización debe mostrar contado, anticipo, cargo financiero, total financiado y mensualidad aproximada.

Modificar un plan general no altera opciones ya cotizadas. Una tasa especial debe guardar tasa predeterminada, tasa aplicada, motivo y autorizador.

La deuda se crea únicamente cuando el paciente acepta el plan mediante un `FinancingAgreement`. Entonces se generan mensualidades individuales; la última absorbe diferencias de redondeo.

## 13. Pagos

Cada pago debe guardar importe, fecha, método, referencia, usuario registrador y aplicación a mensualidades.

Estados de mensualidad:

```text
pending | partiallyPaid | paid | overdue | cancelled
```

Registrar un pago no completa procedimientos clínicos. Completar un procedimiento tampoco liquida automáticamente una mensualidad.

## 14. Cierre del tratamiento

El cierre debe registrar:

- Tipo y fecha.
- Resumen clínico.
- Estado final del paciente.
- Procedimientos completados y pendientes.
- Recomendaciones.
- Evidencias o diagramas finales.
- Firmas correspondientes.

Tipos:

```text
completed | partialCompletion | patientDecision
clinicalCancellation | lossOfFollowUp | transfer
```

El sistema puede alertar por inactividad, pero un tratamiento no debe cerrarse automáticamente.

## 15. Experiencia de usuario

La página principal del tratamiento tendrá:

```text
Resumen | Plan clínico | Seguimiento | Evidencias | Documentos | Finanzas
```

La cabecera mostrará estado, fase actual, próximo paso, fecha recomendada, alertas y progreso. El botón principal será `Registrar seguimiento`.

El paciente podrá consultar estado, fase, próxima cita, indicaciones publicadas, cotización aceptada, plan de pagos, saldo y próximo vencimiento. Las notas internas y auditoría no se publicarán automáticamente.

## 16. Seguridad y auditoría

- Aislamiento estricto por organización.
- Acceso basado en rol, clínica y relación asistencial.
- Autenticación individual.
- Registro de autor, fecha y cambios relevantes.
- Documentos firmados inalterables.
- Historial de versiones.
- Protección de información clínica y financiera.
- Exportación del expediente autorizado.

## 17. Criterios de aceptación

La implementación será aceptada cuando:

1. Una valoración pueda terminar con servicios variables y cero o más diagnósticos.
2. Un dentista pueda crear un tratamiento por fases desde una plantilla o desde cero.
3. Cada seguimiento produzca una nota clínica trazable.
4. Los cambios significativos creen una nueva versión y, cuando corresponda, otro consentimiento.
5. La clínica pueda generar una cotización con descuentos por concepto.
6. Dentamax pueda comparar contado y planes financiados con anticipo opcional.
7. Aceptar financiamiento genere mensualidades exactas.
8. Pagos y progreso clínico permanezcan independientes.
9. El cierre documente el estado final y pendientes.
10. Todas las acciones respeten roles, clínicas y auditoría.
