'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ClipboardList, Eye, FileSpreadsheet, FileText, Landmark, User, Users } from 'lucide-react'

import { Button } from '#/shared/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/shared/components/ui/card'
import { Input } from '#/shared/components/ui/input'
import { Label } from '#/shared/components/ui/label'
import { NativeSelect } from '#/shared/components/ui/native-select'
import { Textarea } from '#/shared/components/ui/textarea'

import {
  createPublicOrderAction,
  getPublicClinicsAction,
} from '#/modules/order/server/generalOrder'

type Clinic = {
  id: string
  name: string
  phone: string | null
  addressLine: string | null
}

export default function PublicOrderWizard() {
  const router = useRouter()

  // Steps: 1 (Doctor), 2 (Patient), 3 (Clinic), 4 (Study Type), 5 (Study Details), 6 (Review), 7 (Success)
  const [step, setStep] = useState(1)
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [isLoadingClinics, setIsLoadingClinics] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [successInfo, setSuccessInfo] = useState<{ folio: string; orderId: string } | null>(null)

  // Form State
  const [doctor, setDoctor] = useState({
    firstName: '',
    paternalLastName: '',
    maternalLastName: '',
    email: '',
    phone: '',
    professionalLicense: '',
    specialty: '',
    clinicName: '',
  })

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
      if (!doctor.firstName.trim()) stepErrors.firstName = 'El nombre es obligatorio'
      if (!doctor.paternalLastName.trim()) stepErrors.paternalLastName = 'El apellido paterno es obligatorio'
      if (!doctor.email.trim()) {
        stepErrors.email = 'El correo electrónico es obligatorio'
      } else if (!/\S+@\S+\.\S+/.test(doctor.email)) {
        stepErrors.email = 'Formato de correo electrónico inválido'
      }
    } else if (currentStep === 2) {
      if (!patient.firstName.trim()) stepErrors.patientFirstName = 'El nombre del paciente es obligatorio'
    } else if (currentStep === 3) {
      if (!clinicId) stepErrors.clinicId = 'Debe seleccionar una clínica'
    } else if (currentStep === 5) {
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
    if (!validateStep(5)) return
    setIsSubmitting(true)
    setSubmitError(null)

    const payload = {
      type: studyType,
      doctor,
      patient,
      clinicId,
      details: studyType === 'radiography' ? radiographyDetails : cbctDetails,
    }

    try {
      const res = await createPublicOrderAction(payload)
      if (res.success) {
        setSuccessInfo({
          folio: res.data.folio,
          orderId: res.data.orderId,
        })
        setStep(7)
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

  const stepsList = [
    { num: 1, label: 'Doctor', icon: User },
    { num: 2, label: 'Paciente', icon: Users },
    { num: 3, label: 'Clínica', icon: Landmark },
    { num: 4, label: 'Estudio', icon: ClipboardList },
    { num: 5, label: 'Detalles', icon: FileText },
    { num: 6, label: 'Revisión', icon: Eye },
  ]

  if (step === 7 && successInfo) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50/50 p-6 dark:bg-zinc-950">
        <Card className="w-full max-w-xl border-zinc-200 shadow-xl dark:border-zinc-800">
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
                Hemos enviado un acuse de recibo a tu correo <strong>{doctor.email}</strong>.
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
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-4xl space-y-8">
        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Solicitud de Estudios Clínicos
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
            Completa el formulario para enviar la solicitud de estudio radiológico.
          </p>
        </div>

        {/* Stepper Header */}
        <div className="hidden md:flex justify-between items-center bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          {stepsList.map((s, idx) => {
            const Icon = s.icon
            const isActive = step === s.num
            const isCompleted = step > s.num
            return (
              <div key={s.num} className="flex items-center flex-1 last:flex-initial">
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-primary text-white scale-110 shadow-sm'
                        : isCompleted
                        ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                        : 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800'
                    }`}
                  >
                    {isCompleted ? <Check className="h-4 w-4" /> : s.num}
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      isActive ? 'text-zinc-900 dark:text-zinc-50 font-bold' : 'text-zinc-400 dark:text-zinc-500'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {idx < stepsList.length - 1 && (
                  <div
                    className={`h-[2px] flex-1 mx-4 transition-all ${
                      step > s.num ? 'bg-emerald-200 dark:bg-emerald-900' : 'bg-zinc-100 dark:bg-zinc-800'
                    }`}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Stepper Header Mobile */}
        <div className="md:hidden flex items-center justify-between bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Paso {step} de 6: {stepsList[step - 1]?.label}
          </span>
          <div className="h-2 w-24 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${(step / 6) * 100}%` }} />
          </div>
        </div>

        {/* Form Card */}
        <Card className="border-zinc-200 shadow-lg dark:border-zinc-800">
          {/* Step 1: Doctor Info */}
          {step === 1 && (
            <>
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Datos del Doctor Solicitante</CardTitle>
                <CardDescription>Ingresa tus datos de contacto y profesionales.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Nombre *</Label>
                    <Input
                      id="firstName"
                      value={doctor.firstName}
                      onChange={(e) => setDoctor({ ...doctor, firstName: e.target.value })}
                      placeholder="Escribe tu nombre"
                    />
                    {errors.firstName && <p className="text-xs text-red-500">{errors.firstName}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paternalLastName">Apellido Paterno *</Label>
                    <Input
                      id="paternalLastName"
                      value={doctor.paternalLastName}
                      onChange={(e) => setDoctor({ ...doctor, paternalLastName: e.target.value })}
                      placeholder="Escribe tu apellido paterno"
                    />
                    {errors.paternalLastName && <p className="text-xs text-red-500">{errors.paternalLastName}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maternalLastName">Apellido Materno</Label>
                    <Input
                      id="maternalLastName"
                      value={doctor.maternalLastName}
                      onChange={(e) => setDoctor({ ...doctor, maternalLastName: e.target.value })}
                      placeholder="Escribe tu apellido materno"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Correo Electrónico *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={doctor.email}
                      onChange={(e) => setDoctor({ ...doctor, email: e.target.value })}
                      placeholder="doctor@ejemplo.com"
                    />
                    {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      value={doctor.phone}
                      onChange={(e) => setDoctor({ ...doctor, phone: e.target.value })}
                      placeholder="Número de contacto"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="professionalLicense">Cédula Profesional</Label>
                    <Input
                      id="professionalLicense"
                      value={doctor.professionalLicense}
                      onChange={(e) => setDoctor({ ...doctor, professionalLicense: e.target.value })}
                      placeholder="Número de cédula"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="specialty">Especialidad</Label>
                    <Input
                      id="specialty"
                      value={doctor.specialty}
                      onChange={(e) => setDoctor({ ...doctor, specialty: e.target.value })}
                      placeholder="Ej. Ortodoncia"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clinicName">Clínica o Consultorio</Label>
                    <Input
                      id="clinicName"
                      value={doctor.clinicName}
                      onChange={(e) => setDoctor({ ...doctor, clinicName: e.target.value })}
                      placeholder="Nombre del consultorio"
                    />
                  </div>
                </div>
              </CardContent>
            </>
          )}

          {/* Step 2: Patient Info */}
          {step === 2 && (
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
                      onChange={(e) => setPatient({ ...patient, sex: e.target.value as any })}
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

          {/* Step 3: Clinic Selection */}
          {step === 3 && (
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
                  <div className="space-y-3">
                    {clinics.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => setClinicId(c.id)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          clinicId === c.id
                            ? 'border-primary bg-primary/5'
                            : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-zinc-900 dark:text-zinc-50">{c.name}</span>
                          <input
                            type="radio"
                            checked={clinicId === c.id}
                            onChange={() => setClinicId(c.id)}
                            className="text-primary focus:ring-primary"
                          />
                        </div>
                        {c.addressLine && (
                          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{c.addressLine}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {errors.clinicId && <p className="text-xs text-red-500">{errors.clinicId}</p>}
              </CardContent>
            </>
          )}

          {/* Step 4: Study Type Selection */}
          {step === 4 && (
            <>
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Tipo de Estudio</CardTitle>
                <CardDescription>Selecciona la modalidad de estudio clínico requerido.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  onClick={() => setStudyType('radiography')}
                  className={`p-6 rounded-xl border-2 cursor-pointer transition-all text-center space-y-3 ${
                    studyType === 'radiography'
                      ? 'border-primary bg-primary/5'
                      : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                  }`}
                >
                  <FileSpreadsheet className="h-10 w-10 mx-auto text-primary" />
                  <div>
                    <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-50">Radiografía</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Estudios panorámicos, periapicales o cefalométricos.</p>
                  </div>
                </div>

                <div
                  onClick={() => setStudyType('cbct')}
                  className={`p-6 rounded-xl border-2 cursor-pointer transition-all text-center space-y-3 ${
                    studyType === 'cbct'
                      ? 'border-primary bg-primary/5'
                      : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                  }`}
                >
                  <ClipboardList className="h-10 w-10 mx-auto text-primary" />
                  <div>
                    <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-50">Tomografía CBCT</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Tomografía computarizada de haz cónico volumétrica.</p>
                  </div>
                </div>
              </CardContent>
            </>
          )}

          {/* Step 5: Study Details */}
          {step === 5 && (
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

          {/* Step 6: Review */}
          {step === 6 && (
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
                      <div><span className="font-medium text-zinc-950 dark:text-zinc-50">Nombre:</span> {doctor.firstName} {doctor.paternalLastName} {doctor.maternalLastName}</div>
                      <div><span className="font-medium text-zinc-950 dark:text-zinc-50">Correo:</span> {doctor.email}</div>
                      <div><span className="font-medium text-zinc-950 dark:text-zinc-50">Cédula:</span> {doctor.professionalLicense || 'N/A'}</div>
                      <div><span className="font-medium text-zinc-950 dark:text-zinc-50">Consultorio:</span> {doctor.clinicName || 'N/A'}</div>
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
          <div className="p-6 bg-zinc-50/50 dark:bg-zinc-900/50 border-t border-zinc-200 dark:border-zinc-800 flex justify-between gap-4">
            {step > 1 ? (
              <Button onClick={handleBack} variant="outline" disabled={isSubmitting}>
                Atrás
              </Button>
            ) : (
              <div />
            )}

            {step < 6 ? (
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
    </div>
  )
}
