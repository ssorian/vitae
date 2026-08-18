type Props = { searchParams: Promise<{ error?: string }> }

export default async function OrderAccessPage({ searchParams }: Props) {
  const { error } = await searchParams
  return <main className="mx-auto max-w-sm space-y-6 p-6"><header><h1 className="text-2xl font-semibold">Consultar resultados</h1><p className="text-sm text-zinc-600">Ingresa tu folio y código de acceso.</p></header>{error && <p className="rounded border border-red-300 p-3 text-sm text-red-700">No fue posible validar los datos.</p>}<form action="/api/order/access" method="post" className="space-y-4"><label className="block text-sm">Folio<input required name="folio" className="mt-1 w-full rounded border p-2" autoComplete="off" /></label><label className="block text-sm">Código<input required name="code" className="mt-1 w-full rounded border p-2" autoComplete="off" /></label><button className="rounded bg-primary px-4 py-2 text-primary-foreground">Ver resultados</button></form></main>
}
