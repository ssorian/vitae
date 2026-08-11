'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Badge } from '#/shared/components/ui/badge'
import { Button } from '#/shared/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/shared/components/ui/table'

import { listOrdersAction } from '#/modules/order/server/generalOrder'

type OrderRow = Awaited<ReturnType<typeof listOrdersAction>>[number]

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  received: 'Recibida',
  scheduled: 'Agendada',
  in_progress: 'En proceso',
  ready: 'Lista',
  delivered: 'Entregada',
  cancelled: 'Cancelada',
}

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  draft: 'outline',
  received: 'secondary',
  scheduled: 'secondary',
  in_progress: 'default',
  ready: 'default',
  delivered: 'outline',
  cancelled: 'destructive',
}

const TYPE_LABELS: Record<string, string> = {
  radiography: 'Radiografía',
  cbct: 'Tomografía CBCT',
}

const COMPLETED_STATUSES = new Set(['ready', 'delivered'])

export default function OrgOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    listOrdersAction()
      .then((data) => {
        setOrders([...data].sort((a, b) => Number(COMPLETED_STATUSES.has(a.status)) - Number(COMPLETED_STATUSES.has(b.status))))
        setIsLoading(false)
      })
      .catch((err) => {
        console.error('Error loading orders:', err)
        setIsLoading(false)
      })
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Órdenes
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Gestiona las solicitudes de estudios clínicos.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-zinc-400">Cargando órdenes...</div>
      ) : orders.length === 0 ? (
        <div className="py-20 text-center text-zinc-400">
          <p className="font-medium">No hay órdenes registradas.</p>
          <p className="text-sm mt-1">Las órdenes enviadas desde el portal público aparecerán aquí.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-zinc-50 dark:bg-zinc-900">
                <TableHead className="font-semibold text-zinc-700 dark:text-zinc-300">Folio</TableHead>
                <TableHead className="font-semibold text-zinc-700 dark:text-zinc-300">Paciente</TableHead>
                <TableHead className="font-semibold text-zinc-700 dark:text-zinc-300">Doctor Solicitante</TableHead>
                <TableHead className="font-semibold text-zinc-700 dark:text-zinc-300">Tipo</TableHead>
                <TableHead className="font-semibold text-zinc-700 dark:text-zinc-300">Clínica</TableHead>
                <TableHead className="font-semibold text-zinc-700 dark:text-zinc-300">Estado</TableHead>
                <TableHead className="font-semibold text-zinc-700 dark:text-zinc-300">Fecha</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => {
                const patient = order.patientHistory?.patient
                const doctor = order.doctorClient
                const patientName = patient
                  ? `${patient.firstName} ${patient.paternalLastName ?? ''} ${patient.maternalLastName ?? ''}`.trim()
                  : '—'
                const doctorName = doctor
                  ? `${doctor.firstName} ${doctor.paternalLastName}`.trim()
                  : '—'

                return (
                  <TableRow
                    key={order.id}
                    className="hover:bg-zinc-50/70 dark:hover:bg-zinc-900/50 transition-colors"
                  >
                    <TableCell className="font-mono text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                      {order.folio}
                    </TableCell>
                    <TableCell className="font-medium text-zinc-900 dark:text-zinc-50">
                      {patientName}
                    </TableCell>
                    <TableCell className="text-zinc-600 dark:text-zinc-400 text-sm">
                      {doctorName}
                    </TableCell>
                    <TableCell className="text-zinc-600 dark:text-zinc-400 text-sm">
                      {TYPE_LABELS[order.type] ?? order.type}
                    </TableCell>
                    <TableCell className="text-zinc-600 dark:text-zinc-400 text-sm">
                      {order.clinic?.name ?? '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[order.status] ?? 'outline'}>
                        {STATUS_LABELS[order.status] ?? order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-zinc-500 dark:text-zinc-400 text-xs">
                      {new Date(order.createdAt).toLocaleDateString('es-MX', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </TableCell>
                    <TableCell>
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/org/orders/${order.id}`}>
                          Ver
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
