'use client'

import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'

import { ClinicForm } from '#/modules/clinic/components/ClinicForm'
import {
  useArchiveClinic,
  useClinics,
} from '#/modules/clinic/hooks/clinicQueries'
import type { ClinicInput } from '#/modules/clinic/schemas/clinic'

import { Button } from '#/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '#/shared/components/ui/dialog'

import Link from 'next/link'

type Clinic = Omit<
  ClinicInput,
  | 'phone'
  | 'email'
  | 'addressLine'
  | 'neighborhood'
  | 'municipality'
  | 'state'
  | 'postalCode'
> & {
  id: string
  phone: string | null
  email: string | null
  addressLine: string | null
  neighborhood: string | null
  municipality: string | null
  state: string | null
  postalCode: string | null
}

type EditableClinic = ClinicInput & {
  id: string
}

export default function Clinics() {
  const [editingClinic, setEditingClinic] = useState<EditableClinic | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const clinics = useClinics()
  const archiveClinic = useArchiveClinic()

  function openCreateDialog() {
    setEditingClinic(null)
    setDialogOpen(true)
  }

  function openEditDialog(clinic: Clinic) {
    setEditingClinic({
      ...clinic,
      phone: clinic.phone ?? undefined,
      email: clinic.email ?? undefined,
      addressLine: clinic.addressLine ?? undefined,
      neighborhood: clinic.neighborhood ?? undefined,
      municipality: clinic.municipality ?? undefined,
      state: clinic.state ?? undefined,
      postalCode: clinic.postalCode ?? undefined,
    })
    setDialogOpen(true)
  }

  function closeDialog() {
    setDialogOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Clínicas</h1>

          <p className="text-muted-foreground">
            Administra las clínicas de tu organización.
          </p>
        </div>

        <Button onClick={openCreateDialog}>
          <Plus aria-hidden="true" />
          Nueva clínica
        </Button>
      </div>

      {clinics.isLoading ? (
        <p className="text-muted-foreground">
          Cargando clínicas...
        </p>
      ) : clinics.isError ? (
        <div className="rounded-lg border border-destructive/50 p-8 text-center">
          <p className="text-sm text-destructive">
            No se pudieron cargar las clínicas.
          </p>
        </div>
      ) : clinics.data?.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {clinics.data.map((clinic) => (
            <article
              key={clinic.id}
              className="rounded-lg border p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold">
                    {clinic.name}
                  </h2>

                  <p className="text-sm text-muted-foreground">
                    {clinic.status === 'active'
                      ? 'Activa'
                      : 'Inactiva'}
                    {' · '}
                    {clinic.timezone}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label={`Editar ${clinic.name}`}
                    onClick={() => openEditDialog(clinic)}
                  >
                    <Pencil aria-hidden="true" />
                  </Button>

                  <Button
                    variant="destructive"
                    size="icon-sm"
                    aria-label={`Archivar ${clinic.name}`}
                    disabled={archiveClinic.isPending}
                    onClick={() => {
                      if (window.confirm(`¿Archivar ${clinic.name}?`)) {
                        archiveClinic.mutate(clinic.id)
                      }
                    }}
                  >
                    <Trash2 aria-hidden="true" />
                  </Button>
                </div>
              </div>

              <div className="mt-4 grid gap-1 text-sm text-muted-foreground">
                {clinic.phone && (
                  <div>Teléfono: {clinic.phone}</div>
                )}

                {clinic.email && (
                  <div>Correo: {clinic.email}</div>
                )}

                {clinic.addressLine && (
                  <div>Dirección: {clinic.addressLine}</div>
                )}

                {clinic.neighborhood && (
                  <div>Colonia: {clinic.neighborhood}</div>
                )}

                {clinic.municipality && (
                  <div>Municipio: {clinic.municipality}</div>
                )}

                {clinic.state && (
                  <div>Estado: {clinic.state}</div>
                )}

                {clinic.postalCode && (
                  <div>C.P.: {clinic.postalCode}</div>
                )}
              </div>

              <Button asChild className="mt-4">
                <Link href={`/clinics/${clinic.id}`}>
                  Entrar a clínica
                </Link>
              </Button>
            </article>
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          Aún no hay clínicas.
        </p>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingClinic
                ? 'Editar clínica'
                : 'Nueva clínica'}
            </DialogTitle>

            <DialogDescription>
              Completa los datos de la clínica.
            </DialogDescription>
          </DialogHeader>

          <ClinicForm
            key={editingClinic?.id ?? 'new'}
            clinic={editingClinic}
            onSaved={closeDialog}
            onCancel={closeDialog}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}