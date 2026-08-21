# PRD — Integración de Estudios y Servicios en Órdenes

## 1. Objetivo

Implementar en Dentamax un catálogo normalizado de estudios y servicios solicitables desde `/orders`, conservando prácticamente los mismos detalles presentes en los formatos físicos actuales de Vitae.

Cada orden deberá:

* Asociarse a un `doctorClient`.
* Asociarse a un `patient`.
* Tener un tipo de estudio/servicio.
* Guardar detalles específicos mediante `details` JSONB.
* Mostrar únicamente los campos correspondientes al estudio seleccionado.
* Permitir observaciones generales.
* Facilitar agregar nuevos estudios sin modificar la estructura principal de `Order`.

## 2. Modelo general

```ts
Order {
  id
  organizationId
  doctorClientId
  patientId

  serviceCode
  details: jsonb

  observations?
  status

  createdAt
  updatedAt
}
```

`serviceCode` identifica la familia o servicio solicitado. `details` debe validarse mediante un schema Zod específico.

No crear una tabla o columna diferente por cada variante de estudio.

---

## 3. Radiografías 2D

`serviceCode: radiography_2d`

Variantes:

### Panorámica Insight

```ts
{
  variant: 'panoramic_insight'
}
```

Sin detalles adicionales.

### Panorámica / Ortopantomografía

```ts
{
  variant: 'panoramic'
}
```

### Media panorámica

```ts
{
  variant: 'half_panoramic'
  side: 'left' | 'right'
}
```

### Lateral de cráneo

```ts
{
  variant: 'lateral_cephalometric'
  scope: 'complete' | 'profile_only'
}
```

### ATM lateral boca abierta/cerrada

```ts
{
  variant: 'tmj_open_closed_lateral'
}
```

### Senos paranasales

Incluye lateral de cráneo, Waters y P-A.

```ts
{
  variant: 'paranasal_sinuses'
}
```

### Caldwell / Hirtz

Sin parámetros adicionales.

### Waters

```ts
{
  variant: 'waters'
  mouthPosition: 'open' | 'closed'
}
```

### P-A / A-P

```ts
{
  variant: 'pa_ap'
  projection: 'PA' | 'AP'
}
```

### Dígito palmar / Carpal

```ts
{
  variant: 'carpal'
  side: 'left' | 'right'
}
```

---

## 4. Tomografía Cone Beam — CBCT

`serviceCode: cbct`

Campos variables:

```ts
{
  fov:
    | '4x4'
    | '5x5'
    | '8x5'
    | '8x8'
    | '10x9'
    | '12x9'
    | '15x9'
    | '15x15'

  region:
    | 'teeth'
    | 'maxilla'
    | 'mandible'
    | 'maxilla_mandible'
    | 'tmj'
    | 'airways'
    | 'paranasal_sinuses'
    | 'facial_skeleton'

  toothNumbers?: string[]
  amperage?: 'normal' | 'high'
  tmjPosition?: 'occlusion' | 'opening' | 'both'
  regionOfInterestNotes?: string
}
```

Reglas:

* `4x4/5x5`: permitir seleccionar de 1 a 3 dientes y normal/amperaje alto.
* `8x5`: seleccionar maxilar o mandíbula.
* `8x8`: maxilar + mandíbula.
* ATM: permitir oclusión, apertura o ambas.
* `12x9`: maxilar + mandíbula hasta terceros molares.
* `15x9`: permitir ATM, vías aéreas y/o senos paranasales.
* `15x15`: macizo facial.

---

## 5. Análisis cefalométricos

`serviceCode: cephalometric_analysis`

```ts
{
  analyses: Array<
    'steiner' |
    'jarabak' |
    'ricketts' |
    'ricketts_summary' |
    'custom'
  >

  customTechnique?: string
}
```

Debe permitirse seleccionar múltiples análisis.

---

## 6. Modelos de estudio

`serviceCode: study_models`

```ts
{
  material:
    | 'orthodontic_plaster'
    | 'resin'
}
```

Los modelos se consideran enzocalados según el servicio actual.

---

## 7. Escaneo intraoral

`serviceCode: intraoral_scan`

```ts
{
  outputFormat: 'STL'
}
```

No requiere otros campos según los formatos actuales.

---

## 8. Estudio ortodóntico

`serviceCode: orthodontic_package`

Tipos:

* `complete`
* `complete_3d`

Campos:

```ts
{
  package: 'complete' | 'complete_3d'

  lateralScope: 'complete' | 'profile_only'

  cephalometricTechnique?: string

  modelMaterial:
    | 'orthodontic_plaster'
    | 'resin'

  cbct?: {
    fov: '10x9' | '12x9' | '15x9' | '15x15'
  }
}
```

El paquete incluye:

* Panorámica.
* Lateral de cráneo.
* Trazado cefalométrico.
* Fotografías intraorales y extraorales.
* Modelos.

`complete_3d` agrega CBCT.

---

## 9. Paquete de alineadores

`serviceCode: aligner_package`

Debe permitir marcar:

```ts
{
  tomography: boolean
  lateral: boolean
  intraoralScanStl: boolean
  cephalometry: boolean
  models: boolean
  panoramic: boolean
  clinicalPhotography: boolean
}
```

Cuando un elemento requiera detalles, mostrar dinámicamente sus respectivos inputs.

---

## 10. Orden de laboratorio

`serviceCode: laboratory_order`

Campos:

```ts
{
  work: string
  receivedAt?: Date
  deliveryAt?: Date

  impression?: 'analog' | 'digital'
  antagonist?: 'upper' | 'lower'
  biteRegistration?: 'analog' | 'digital'

  prototype?: boolean
  photos?: boolean
  other?: string

  shade?: {
    system?: 'vita' | 'chromascop'
    substrate?: string
    final?: string
    colorimeter?: string
  }

  toothNumbers: string[]

  material?:
    | 'emax'
    | 'zirconia'
    | 'feldspathic'
    | 'wax_up'
    | 'pmma'
    | 'splint'
    | 'surgical_guide'
    | 'periodontal_surgical_guide'

  materialVariant?: 'mono' | 'estra'

  implant?: {
    brand?: string
    diameter?: string
    attachments: Array<{
      name: string
      quantity: number
    }>
    customized?: boolean
    bar?: string
  }
}
```

El odontograma debe funcionar como selector visual de `toothNumbers`.

---

## 11. Endodoncia

La hoja de endodoncia corresponde a información clínica y debe mantenerse separada de las órdenes radiológicas/laboratorio.

Si se implementa, utilizar `endodontic_evaluation` con:

* Diente.
* Corona anatómica.
* Inflamación.
* Gingivitis.
* Sarro.
* Fístula y ubicación.
* Dolor y características.
* Percusión.
* Palpación.
* Bolsas periodontales y sondeo.
* Movilidad.
* Cámara pulpar.
* Número y características de conductos.
* Lesiones radiográficas.
* Fractura radicular.
* Calcificación.
* Reabsorción.
* Ligamento periodontal.
* Diagnóstico pulpar.
* Diagnóstico periapical.
* Plan de tratamiento.
* Técnica de instrumentación.
* Técnica de obturación.
* Agente irrigante.
* Restauración post-endodoncia.

Conductos:

```ts
{
  canals: Array<{
    canal: string
    tentativeLength?: number
    workingLength?: number
    guttaPerchaPoint?: string
  }>
}
```

---

## 12. Validación y UI

Cada `serviceCode` debe tener:

* Schema Zod propio.
* Formulario dinámico.
* Valores y labels centralizados.
* Validación del lado servidor.
* Renderizador de detalles para `/org/orders/[id]`.

Se recomienda una `discriminatedUnion` para validar `details`.

Los campos condicionales deben aparecer únicamente cuando correspondan a la opción seleccionada.

## 13. Criterio de aceptación

La implementación queda completa cuando un doctor cliente pueda reproducir digitalmente las selecciones realizadas actualmente en los formatos físicos, enviar la orden y el Owner pueda consultar posteriormente todos los detalles seleccionados sin pérdida de información.
