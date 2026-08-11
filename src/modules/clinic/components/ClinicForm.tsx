/* eslint-disable react-hooks/static-components */
import { useForm } from '@tanstack/react-form'
import { useCreateClinic, useUpdateClinic } from '../hooks/clinicQueries'
import { clinicInputSchema, type ClinicInput } from '../schemas/clinic'
import { Button } from '#/shared/components/ui/button'
import { Input } from '#/shared/components/ui/input'
import { Label } from '#/shared/components/ui/label'

export type ClinicFormValues = ClinicInput
type Clinic = ClinicInput & { id: string }
const emptyClinic: ClinicInput = { name: '', phone: '', email: '', addressLine: '', neighborhood: '', municipality: '', state: '', postalCode: '', timezone: 'America/Mexico_City', slotIntervalMinutes: 15, status: 'active' }

export function ClinicForm({ clinic, onSaved, onCancel }: { clinic: Clinic | null; onSaved: () => void; onCancel: () => void }) {
  const createClinic = useCreateClinic(); const updateClinic = useUpdateClinic()
  const form = useForm({ defaultValues: clinic ?? emptyClinic, validators: { onSubmit: clinicInputSchema }, onSubmit: async ({ value }) => { if (clinic) await updateClinic.mutateAsync({ id: clinic.id, ...value }); else await createClinic.mutateAsync(value); onSaved() } })
  const isPending = createClinic.isPending || updateClinic.isPending
  function FormField({ name, label, type = 'text', required = false }: { name: Exclude<keyof ClinicInput, 'status'>; label: string; type?: string; required?: boolean }) { return <form.Field name={name}>{(field) => <div className="grid gap-2"><Label htmlFor={field.name}>{label}</Label><Input id={field.name} type={type} required={required} value={field.state.value} onChange={(event) => field.handleChange((type === 'number' ? Number(event.target.value) : event.target.value) as never)} /></div>}</form.Field> }
  return <form className="grid gap-4 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); form.handleSubmit() }}><FormField name="name" label="Nombre" required /><FormField name="phone" label="Teléfono" /><FormField name="email" label="Correo" type="email" /><FormField name="timezone" label="Zona horaria" required /><FormField name="slotIntervalMinutes" label="Intervalo de agenda (minutos)" type="number" required /><FormField name="addressLine" label="Dirección" /><FormField name="neighborhood" label="Colonia" /><FormField name="municipality" label="Municipio" /><FormField name="state" label="Estado" /><FormField name="postalCode" label="Código postal" /><form.Field name="status">{(field) => <div className="grid gap-2"><Label htmlFor={field.name}>Estado</Label><select id={field.name} className="h-8 rounded-2xl bg-input/50 px-2.5 text-sm" value={field.state.value} onChange={(event) => field.handleChange(event.target.value as 'active' | 'inactive')}><option value="active">Activa</option><option value="inactive">Inactiva</option></select></div>}</form.Field><div className="col-span-full flex justify-end gap-2"><Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button><Button type="submit" disabled={isPending}>{isPending ? 'Guardando...' : 'Guardar'}</Button></div>{(createClinic.isError || updateClinic.isError) && <p className="col-span-full text-sm text-destructive">No se pudo guardar la clínica.</p>}</form>
}
