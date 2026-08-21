'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ClipboardList, FileSpreadsheet } from 'lucide-react'

import { Button } from '#/shared/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/shared/components/ui/card'
import { Input } from '#/shared/components/ui/input'
import { Label } from '#/shared/components/ui/label'
import { NativeSelect } from '#/shared/components/ui/native-select'
import { Textarea } from '#/shared/components/ui/textarea'

import AppointmentWizardFrame from './AppointmentWizardFrame'

import {
  createProfessionalOrderAction,
  getProfessionalOrderAccessAction,
  getPublicClinicsAction,
} from '#/modules/order/server/generalOrder'

type Clinic = {
  id: string
  name: string
  phone: string | null
  addressLine: string | null
}

type ProfessionalOrderWizardProps = {
  onBack: () => void
}

const steps = ['Paciente', 'Clínica', 'Estudio', 'Detalles', 'Revisión', 'Confirmación']

export default function ProfessionalOrderWizard({ onBack }: ProfessionalOrderWizardProps) {
  const router = useRouter()
  // The authenticated doctor is resolved server-side; the browser never supplies it.
  const [step, setStep] = useState(1)
  const [access, setAccess] = useState<{ authenticated: boolean; active: boolean; doctor?: { firstName: string; paternalLastName: string; email: string } } | null>(null)
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [isLoadingClinics, setIsLoadingClinics] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [successInfo, setSuccessInfo] = useState<{ folio: string; orderId: string } | null>(null)

  // Form State
  const [patient, setPatient] = useState({
    firstName: '',
    paternalLastName: '',
    maternalLastName: '',
    birthDate: '',
    sex: 'unspecified' as 'male' | 'female' | 'other' | 'unspecified',
    phone: '',
    email: '',
  })

  const [clinicId, setClinicId] = useState('')
  const [studyType, setStudyType] = useState<'radiography' | 'cbct'>('radiography')

  // Details radiography
  const [radiographyDetails, setRadiographyDetails] = useState({
    radiographyType: '',
    region: '',
    clinicalIndication: '',
    notes: '',
  })

  // Details cbct
  const [cbctDetails, setCbctDetails] = useState({
    anatomicalRegion: '',
    specificArea: '',
    clinicalIndication: '',
    notes: '',
  })

  // Validation State for current step
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Resolve the active linked doctorClient on the server before enabling the form.
  useEffect(() => {
    getProfessionalOrderAccessAction().then(setAccess).catch(() => setAccess({ authenticated: false, active: false }))
  }, [])

  // Load clinics on mount
  useEffect(() => {
    getPublicClinicsAction()
      .then((data) => {
        setClinics(data)
        if (data.length > 0) {
          setClinicId(data[0].id)
        }
        setIsLoadingClinics(false)
      })
      .catch((err) => {
        console.error('Error loading clinics:', err)
        setIsLoadingClinics(false)
      })
  }, [])

  const validateStep = (currentStep: number): boolean => {
    const stepErrors: Record<string, string> = {}

    if (currentStep === 1) {
      if (!patient.firstName.trim()) stepErrors.patientFirstName = 'El nombre del paciente es obligatorio'
    } else if (currentStep === 2) {
      if (!clinicId) stepErrors.clinicId = 'Debe seleccionar una clínica'
    } else if (currentStep === 4) {
      if (studyType === 'radiography') {
        if (!radiographyDetails.radiographyType.trim()) {
          stepErrors.radiographyType = 'El tipo de radiografía es obligatorio'
        }
        if (!radiographyDetails.region.trim()) {
          stepErrors.region = 'La pieza o región es obligatoria'
        }
        if (!radiographyDetails.clinicalIndication.trim()) {
          stepErrors.clinicalIndication = 'La indicación clínica es obligatoria'
        }
      } else {
        if (!cbctDetails.anatomicalRegion.trim()) {
          stepErrors.anatomicalRegion = 'La región anatómica es obligatoria'
        }
        if (!cbctDetails.specificArea.trim()) {
          stepErrors.specificArea = 'El área específica es obligatoria'
        }
        if (!cbctDetails.clinicalIndication.trim()) {
          stepErrors.clinicalIndication = 'La indicación clínica es obligatoria'
        }
      }
    }

    setErrors(stepErrors)
    return Object.keys(stepErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => prev + 1)
    }
  }

  const handleBack = () => {
    setStep((prev) => Math.max(1, prev - 1))
  }

  const handleSubmit = async () => {
    if (!validateStep(4)) return
    setIsSubmitting(true)
    setSubmitError(null)

    const payload = {
      type: studyType,
      patient,
      clinicId,
      details: studyType === 'radiography' ? radiographyDetails : cbctDetails,
    }

    try {
      const res = await createProfessionalOrderAction(payload)
      if (res.success) {
        setSuccessInfo({
          folio: res.data.folio,
          orderId: res.data.orderId,
        })
        setStep(6)
      } else {
        setSubmitError(res.error === 'INVALID_INPUT' ? 'Por favor revisa los datos ingresados.' : 'No se pudo crear la solicitud. Intenta más tarde.')
      }
    } catch (err) {
      console.error('Error submitting order:', err)
      setSubmitError('Ocurrió un error inesperado al procesar tu solicitud.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (access === null) {
    return <div className="py-16 text-center text-zinc-600">Verificando acceso profesional...</div>
  }

  if (!access.authenticated) {
    return <div className="mx-auto max-w-xl py-16"><Card><CardHeader><CardTitle>Inicia sesión para solicitar estudios</CardTitle><CardDescription>Tu cuenta profesional debe estar vinculada para solicitar estudios para tus pacientes.</CardDescription></CardHeader><CardContent><Button onClick={() => { router.push('/login?redirect=%2Fappointments%3Ftipo%3Ddoctor') }}>Continuar con Google o iniciar sesión</Button></CardContent></Card></div>
  }

  if (!access.active || !access.doctor) {
    return <div className="mx-auto max-w-xl py-16"><Card><CardHeader><CardTitle>Se requiere un perfil profesional activo</CardTitle><CardDescription>Tu cuenta no tiene un perfil profesional vinculado. Completa el acceso con Google para crear o vincular tu perfil antes de solicitar estudios.</CardDescription></CardHeader><CardContent><Button onClick={() => { router.push('/login?redirect=%2Fappointments%3Ftipo%3Ddoctor') }}>Completar acceso profesional</Button></CardContent></Card></div>
  }

  if (step === 6 && successInfo) {
    return (
      <AppointmentWizardFrame title="Solicitud de estudios clínicos" subtitle="Tu solicitud quedó registrada y está lista para seguimiento." steps={steps} currentStep={6} backLabel="Elegir otra opción" onBack={onBack}>
        <div className="mx-auto max-w-xl text-center">
          <Card>
            <CardContent className="pt-10 text-center space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <Check className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                ¡Solicitud enviada con éxito!
              </CardTitle>
              <CardDescription className="text-zinc-500 dark:text-zinc-400">
                Tu solicitud de estudio clínico ha sido registrada correctamente.
              </CardDescription>
            </div>

            <div className="rounded-lg bg-zinc-100 p-4 dark:bg-zinc-900 text-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Folio de seguimiento</span>
              <p className="mt-1 text-3xl font-extrabold tracking-tight text-primary">{successInfo.folio}</p>
            </div>

            <div className="text-sm text-zinc-600 dark:text-zinc-300 space-y-2 max-w-md mx-auto">
              <p>
                Hemos enviado un acuse de recibo a tu correo <strong>{access.doctor.email}</strong>.
              </p>
              <p>
                Cuando los resultados del estudio estén listos, recibirás un enlace de acceso seguro para descargarlos.
              </p>
            </div>

            <div className="pt-4">
              <Button onClick={() => window.location.reload()} variant="outline" className="w-full sm:w-auto">
                Solicitar otro estudio
              </Button>
            </div>
            </CardContent>
          </Card>
        </div>
      </AppointmentWizardFrame>
    )
  }

  return (
    <AppointmentWizardFrame title="Solicitud de estudios clínicos" subtitle="Completa el formulario para enviar la solicitud de estudio radiológico." steps={steps} currentStep={step} backLabel="Elegir otra opción" onBack={onBack}>
      <div className="mx-auto">
        <Card>
          {/* Step 1: Patient Info */}
          {step === 1 && (
            <>
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Datos del Paciente</CardTitle>
                <CardDescription>Ingresa los datos personales del paciente.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="patientFirstName">Nombre *</Label>
                    <Input
                      id="patientFirstName"
                      value={patient.firstName}
                      onChange={(e) => setPatient({ ...patient, firstName: e.target.value })}
                      placeholder="Nombre del paciente"
                    />
                    {errors.patientFirstName && <p className="text-xs text-red-500">{errors.patientFirstName}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="patientPaternalLastName">Apellido Paterno</Label>
                    <Input
                      id="patientPaternalLastName"
                      value={patient.paternalLastName}
                      onChange={(e) => setPatient({ ...patient, paternalLastName: e.target.value })}
                      placeholder="Apellido paterno"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="patientMaternalLastName">Apellido Materno</Label>
                    <Input
                      id="patientMaternalLastName"
                      value={patient.maternalLastName}
                      onChange={(e) => setPatient({ ...patient, maternalLastName: e.target.value })}
                      placeholder="Apellido materno"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="patientBirthDate">Fecha de Nacimiento</Label>
                    <Input
                      id="patientBirthDate"
                      type="date"
                      value={patient.birthDate}
                      onChange={(e) => setPatient({ ...patient, birthDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="patientSex">Sexo</Label>
                    <NativeSelect
                      id="patientSex"
                      value={patient.sex}
                      onChange={(e) => setPatient({ ...patient, sex: e.target.value as typeof patient.sex })}
                    >
                      <option value="unspecified">Sin especificar</option>
                      <option value="male">Masculino</option>
                      <option value="female">Femenino</option>
                      <option value="other">Otro</option>
                    </NativeSelect>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="patientPhone">Teléfono del Paciente (Opcional)</Label>
                    <Input
                      id="patientPhone"
                      value={patient.phone}
                      onChange={(e) => setPatient({ ...patient, phone: e.target.value })}
                      placeholder="Teléfono del paciente"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="patientEmail">Correo del Paciente (Opcional)</Label>
                  <Input
                    id="patientEmail"
                    type="email"
                    value={patient.email}
                    onChange={(e) => setPatient({ ...patient, email: e.target.value })}
                    placeholder="paciente@ejemplo.com"
                  />
                </div>
              </CardContent>
            </>
          )}

          {/* Step 2: Clinic Selection */}
          {step === 2 && (
            <>
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Ubicación / Sucursal</CardTitle>
                <CardDescription>Selecciona la clínica de Dentamax donde el paciente se realizará el estudio.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingClinics ? (
                  <div className="py-8 text-center text-zinc-500">Cargando clínicas...</div>
                ) : clinics.length === 0 ? (
                  <div className="py-8 text-center text-zinc-500 text-sm">No hay clínicas disponibles.</div>
                ) : (
                  <fieldset className="m-0 min-w-0 border-0 p-0 space-y-3" aria-describedby={errors.clinicId ? 'clinicId-error' : undefined}>
                    <legend className="sr-only">Clínica donde se realizará el estudio</legend>
                    {clinics.map((c) => (
                      <label
                        key={c.id}
                        htmlFor={`clinic-${c.id}`}
                        className={`block p-4 rounded-xl border-2 cursor-pointer transition-all focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 ${
                          clinicId === c.id
                            ? 'border-primary bg-primary/5'
                            : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-zinc-900 dark:text-zinc-50">{c.name}</span>
                          <input
                            id={`clinic-${c.id}`}
                            name="clinicId"
                            type="radio"
                            value={c.id}
                            checked={clinicId === c.id}
                            onChange={() => setClinicId(c.id)}
                            className="text-primary focus:ring-primary"
                          />
                        </div>
                        {c.addressLine && (
                          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{c.addressLine}</p>
                        )}
                      </label>
                    ))}
                  </fieldset>
                )}
                {errors.clinicId && <p id="clinicId-error" className="text-xs text-red-500">{errors.clinicId}</p>}
              </CardContent>
            </>
          )}

          {/* Step 3: Study Type Selection */}
          {step === 3 && (
            <>
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Tipo de Estudio</CardTitle>
                <CardDescription>Selecciona la modalidad de estudio clínico requerido.</CardDescription>
              </CardHeader>
              <CardContent>
                <fieldset className="m-0 min-w-0 border-0 p-0 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <legend className="sr-only">Tipo de estudio</legend>
                  <label
                    htmlFor="study-radiography"
                    className={`p-6 rounded-xl border-2 cursor-pointer transition-all text-center space-y-3 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 ${
                      studyType === 'radiography'
                        ? 'border-primary bg-primary/5'
                        : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                    }`}
                  >
                    <input
                      id="study-radiography"
                      name="studyType"
                      type="radio"
                      value="radiography"
                      checked={studyType === 'radiography'}
                      onChange={() => setStudyType('radiography')}
                      className="sr-only"
                    />
                    <FileSpreadsheet className="h-10 w-10 mx-auto text-primary" />
                    <div>
                      <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-50">Radiografía</h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Estudios panorámicos, periapicales o cefalométricos.</p>
                    </div>
                  </label>

                  <label
                    htmlFor="study-cbct"
                    className={`p-6 rounded-xl border-2 cursor-pointer transition-all text-center space-y-3 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 ${
                      studyType === 'cbct'
                        ? 'border-primary bg-primary/5'
                        : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                    }`}
                  >
                    <input
                      id="study-cbct"
                      name="studyType"
                      type="radio"
                      value="cbct"
                      checked={studyType === 'cbct'}
                      onChange={() => setStudyType('cbct')}
                      className="sr-only"
                    />
                    <ClipboardList className="h-10 w-10 mx-auto text-primary" />
                    <div>
                      <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-50">Tomografía CBCT</h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Tomografía computarizada de haz cónico volumétrica.</p>
                    </div>
                  </label>
                </fieldset>
              </CardContent>
            </>
          )}

          {/* Step 4: Study Details */}
          {step === 4 && (
            <>
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Detalles del Estudio</CardTitle>
                <CardDescription>Ingresa los detalles clínicos específicos del estudio.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {studyType === 'radiography' ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="radiographyType">Tipo de Radiografía *</Label>
                      <Input
                        id="radiographyType"
                        value={radiographyDetails.radiographyType}
                        onChange={(e) => setRadiographyDetails({ ...radiographyDetails, radiographyType: e.target.value })}
                        placeholder="Ej. Panorámica, Cefálica, etc."
                      />
                      {errors.radiographyType && <p className="text-xs text-red-500">{errors.radiographyType}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="region">Pieza o Región *</Label>
                      <Input
                        id="region"
                        value={radiographyDetails.region}
                        onChange={(e) => setRadiographyDetails({ ...radiographyDetails, region: e.target.value })}
                        placeholder="Ej. Mandíbula completa, Pieza 18, etc."
                      />
                      {errors.region && <p className="text-xs text-red-500">{errors.region}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="clinicalIndication">Indicación Clínica *</Label>
                      <Input
                        id="clinicalIndication"
                        value={radiographyDetails.clinicalIndication}
                        onChange={(e) => setRadiographyDetails({ ...radiographyDetails, clinicalIndication: e.target.value })}
                        placeholder="Ej. Planeación de ortodoncia, Extracción de terceros molares"
                      />
                      {errors.clinicalIndication && <p className="text-xs text-red-500">{errors.clinicalIndication}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="radiographyNotes">Observaciones</Label>
                      <Textarea
                        id="radiographyNotes"
                        value={radiographyDetails.notes}
                        onChange={(e) => setRadiographyDetails({ ...radiographyDetails, notes: e.target.value })}
                        placeholder="Cualquier otra instrucción o comentario"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="anatomicalRegion">Región Anatómica *</Label>
                      <Input
                        id="anatomicalRegion"
                        value={cbctDetails.anatomicalRegion}
                        onChange={(e) => setCbctDetails({ ...cbctDetails, anatomicalRegion: e.target.value })}
                        placeholder="Ej. Maxilar, Mandíbula, Ambas arcadas"
                      />
                      {errors.anatomicalRegion && <p className="text-xs text-red-500">{errors.anatomicalRegion}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="specificArea">Área Específica *</Label>
                      <Input
                        id="specificArea"
                        value={cbctDetails.specificArea}
                        onChange={(e) => setCbctDetails({ ...cbctDetails, specificArea: e.target.value })}
                        placeholder="Ej. Articulación temporomandibular (ATM), Senos maxilares"
                      />
                      {errors.specificArea && <p className="text-xs text-red-500">{errors.specificArea}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cbctClinicalIndication">Indicación Clínica *</Label>
                      <Input
                        id="cbctClinicalIndication"
                        value={cbctDetails.clinicalIndication}
                        onChange={(e) => setCbctDetails({ ...cbctDetails, clinicalIndication: e.target.value })}
                        placeholder="Ej. Colocación de implantes, Detección de fractura radicular"
                      />
                      {errors.clinicalIndication && <p className="text-xs text-red-500">{errors.clinicalIndication}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cbctNotes">Observaciones</Label>
                      <Textarea
                        id="cbctNotes"
                        value={cbctDetails.notes}
                        onChange={(e) => setCbctDetails({ ...cbctDetails, notes: e.target.value })}
                        placeholder="Cualquier otra instrucción o comentario"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </>
          )}

          {/* Step 5: Review */}
          {step === 5 && (
            <>
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Revisión de la Solicitud</CardTitle>
                <CardDescription>Verifica la información antes de enviar la orden.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden divide-y divide-zinc-200 dark:divide-zinc-800">
                  {/* Doctor Card */}
                  <div className="p-4 bg-zinc-50/55 dark:bg-zinc-900/50">
                    <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Médico Solicitante</span>
                    <div className="mt-2 text-sm text-zinc-700 dark:text-zinc-300 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div><span className="font-medium text-zinc-950 dark:text-zinc-50">Nombre:</span> {access.doctor.firstName} {access.doctor.paternalLastName}</div>
                      <div><span className="font-medium text-zinc-950 dark:text-zinc-50">Correo:</span> {access.doctor.email}</div>
                    </div>
                  </div>

                  {/* Patient Card */}
                  <div className="p-4">
                    <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Paciente</span>
                    <div className="mt-2 text-sm text-zinc-700 dark:text-zinc-300 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div><span className="font-medium text-zinc-950 dark:text-zinc-50">Nombre:</span> {patient.firstName} {patient.paternalLastName} {patient.maternalLastName}</div>
                      <div><span className="font-medium text-zinc-950 dark:text-zinc-50">Fecha de Nacimiento:</span> {patient.birthDate || 'N/A'}</div>
                      <div><span className="font-medium text-zinc-950 dark:text-zinc-50">Sexo:</span> {patient.sex === 'male' ? 'Masculino' : patient.sex === 'female' ? 'Femenino' : patient.sex === 'other' ? 'Otro' : 'Sin especificar'}</div>
                      <div><span className="font-medium text-zinc-950 dark:text-zinc-50">Teléfono:</span> {patient.phone || 'N/A'}</div>
                    </div>
                  </div>

                  {/* Clinic Card */}
                  <div className="p-4 bg-zinc-50/55 dark:bg-zinc-900/50">
                    <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Clínica de Realización</span>
                    <div className="mt-2 text-sm text-zinc-900 dark:text-zinc-50 font-semibold">
                      {clinics.find((c) => c.id === clinicId)?.name || 'Clínica seleccionada'}
                    </div>
                  </div>

                  {/* Study Details Card */}
                  <div className="p-4">
                    <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Estudio y Especificaciones</span>
                    <div className="mt-2 text-sm text-zinc-700 dark:text-zinc-300 space-y-2">
                      <div>
                        <span className="font-medium text-zinc-950 dark:text-zinc-50">Tipo:</span>{' '}
                        {studyType === 'radiography' ? 'Radiografía' : 'Tomografía CBCT'}
                      </div>
                      {studyType === 'radiography' ? (
                        <>
                          <div><span className="font-medium text-zinc-950 dark:text-zinc-50">Modalidad:</span> {radiographyDetails.radiographyType}</div>
                          <div><span className="font-medium text-zinc-950 dark:text-zinc-50">Región/Pieza:</span> {radiographyDetails.region}</div>
                          <div><span className="font-medium text-zinc-950 dark:text-zinc-50">Indicación:</span> {radiographyDetails.clinicalIndication}</div>
                          {radiographyDetails.notes && <div><span className="font-medium text-zinc-950 dark:text-zinc-50">Notas:</span> {radiographyDetails.notes}</div>}
                        </>
                      ) : (
                        <>
                          <div><span className="font-medium text-zinc-950 dark:text-zinc-50">Región Anatómica:</span> {cbctDetails.anatomicalRegion}</div>
                          <div><span className="font-medium text-zinc-950 dark:text-zinc-50">Área:</span> {cbctDetails.specificArea}</div>
                          <div><span className="font-medium text-zinc-950 dark:text-zinc-50">Indicación:</span> {cbctDetails.clinicalIndication}</div>
                          {cbctDetails.notes && <div><span className="font-medium text-zinc-950 dark:text-zinc-50">Notas:</span> {cbctDetails.notes}</div>}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {submitError && <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950/20 rounded-lg">{submitError}</div>}
              </CardContent>
            </>
          )}

          {/* Footer Controls */}
          <div className="mt-6 flex justify-between gap-4 border-t border-pink-100 bg-pink-50/40 px-6 py-5 sm:px-8">
            {step > 1 ? (
              <Button onClick={handleBack} variant="outline" disabled={isSubmitting}>
                Atrás
              </Button>
            ) : (
              <div />
            )}

            {step < 5 ? (
              <Button onClick={handleNext}>
                Siguiente
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Enviando...' : 'Enviar Solicitud'}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </AppointmentWizardFrame>
  )
}
