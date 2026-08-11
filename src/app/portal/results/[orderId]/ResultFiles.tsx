'use client'

import { useState } from 'react'

import { Button } from '#/shared/components/ui/button'

type Asset = { id: string; name: string; type: string }

export function ResultFiles({ orderId, assets }: { orderId: string; assets: Asset[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null)

  async function openAsset(assetId: string) {
    setLoadingId(assetId)
    try {
      const response = await fetch(`/api/portal/results/${orderId}/assets/${assetId}`)
      const body = await response.json()
      if (!response.ok) throw new Error(body.error)
      window.location.assign(body.signedUrl)
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <ul className="space-y-2">
      {assets.map((asset) => (
        <li key={asset.id} className="flex items-center justify-between rounded border p-3">
          <span>{asset.name} <span className="text-xs text-zinc-500">({asset.type.toUpperCase()})</span></span>
          <Button size="sm" onClick={() => openAsset(asset.id)} disabled={loadingId === asset.id}>
            {loadingId === asset.id ? 'Abriendo...' : 'Abrir archivo'}
          </Button>
        </li>
      ))}
    </ul>
  )
}
