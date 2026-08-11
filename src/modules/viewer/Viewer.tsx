'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'

export type ViewerAsset = {
  id: string
  name: string
  type: 'dicom' | 'image'
  url: string
}

export type ViewerProps = {
  type: 'radiography' | 'cbct'
  assets: ViewerAsset[]
}

type Status = 'loading' | 'empty' | 'unsupported' | 'error' | 'ready'
type ViewerRuntime = { destroy: () => void; action: (name: string) => void }

let cornerstonePromise: Promise<typeof import('@cornerstonejs/core')> | undefined
let toolsPromise: Promise<typeof import('@cornerstonejs/tools')> | undefined
let dicomLoaderPromise: Promise<typeof import('@cornerstonejs/dicom-image-loader')> | undefined
let initialized: Promise<void> | undefined

async function initialize() {
  if (!initialized) {
    initialized = (async () => {
      const cornerstone = await (cornerstonePromise ??= import('@cornerstonejs/core'))
      const tools = await (toolsPromise ??= import('@cornerstonejs/tools'))
      const dicomLoader = await (dicomLoaderPromise ??= import('@cornerstonejs/dicom-image-loader'))
      await cornerstone.init()
      await tools.init()
      dicomLoader.init()
      ;[tools.PanTool, tools.ZoomTool, tools.WindowLevelTool, tools.StackScrollTool, tools.LengthTool, tools.AngleTool, tools.CrosshairsTool].forEach(tools.addTool)
    })()
  }
  return initialized
}

function Controls({ onAction }: { onAction: (action: string) => void }) {
  const controls = [
    ['pan', 'Pan'], ['zoom', 'Zoom'], ['windowLevel', 'Window/level'], ['scroll', 'Scroll'], ['length', 'Length'], ['angle', 'Angle'],
    ['invert', 'Invert'], ['rotate', 'Rotate'], ['flipHorizontal', 'Flip horizontal'], ['flipVertical', 'Flip vertical'], ['fit', 'Fit'], ['reset', 'Reset'], ['fullscreen', 'Fullscreen'],
  ]
  return <div className="flex flex-wrap gap-1 border-b border-zinc-800 bg-zinc-950 p-2">{controls.map(([action, label]) => <button className="rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-100 hover:bg-zinc-700" key={action} onClick={() => onAction(action)} type="button">{label}</button>)}</div>
}

type ImageView = { brightness: number; contrast: number; invert: boolean; rotation: number; scale: number; x: number; y: number; flipHorizontal: boolean; flipVertical: boolean }
const defaultImageView: ImageView = { brightness: 100, contrast: 100, invert: false, rotation: 0, scale: 1, x: 0, y: 0, flipHorizontal: false, flipVertical: false }

function ImageControls({ onAction, view, onViewChange }: { onAction: (action: string) => void; view: ImageView; onViewChange: (view: ImageView) => void }) {
  const controls = [['zoomOut', 'Zoom −'], ['zoomIn', 'Zoom +'], ['invert', 'Invert'], ['rotate', 'Rotate'], ['flipHorizontal', 'Flip horizontal'], ['flipVertical', 'Flip vertical'], ['fit', 'Fit'], ['reset', 'Reset'], ['fullscreen', 'Fullscreen']]
  return <div className="flex flex-wrap items-center gap-1 border-b border-zinc-800 bg-zinc-950 p-2">
    {controls.map(([action, label]) => <button className="rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-100 hover:bg-zinc-700" key={action} onClick={() => onAction(action)} type="button">{label}</button>)}
    <label className="ml-1 flex items-center gap-1 text-xs text-zinc-300">Brightness <input aria-label="Brightness (Window/Level approximation)" className="w-16 accent-zinc-100" max="200" min="0" onChange={(event) => onViewChange({ ...view, brightness: Number(event.target.value) })} title="Non-DICOM Window/Level approximation" type="range" value={view.brightness} /></label>
    <label className="flex items-center gap-1 text-xs text-zinc-300">Contrast <input aria-label="Contrast (Window/Level approximation)" className="w-16 accent-zinc-100" max="200" min="0" onChange={(event) => onViewChange({ ...view, contrast: Number(event.target.value) })} title="Non-DICOM Window/Level approximation" type="range" value={view.contrast} /></label>
    <span className="text-xs text-zinc-500">W/L approximation</span>
  </div>
}

function ImageViewer({ imageAsset, sessionKey, status, setOutcome }: { imageAsset: ViewerAsset; sessionKey: string; status: Status; setOutcome: (outcome: { sessionKey: string; status: 'error' | 'ready' }) => void }) {
    const imageRoot = useRef<HTMLDivElement>(null)
    const dragStart = useRef<{ x: number; y: number; pointerId: number } | null>(null)
    const [imageView, setImageView] = useState<ImageView>(defaultImageView)

    return <>
      {status === 'ready' && <ImageControls onAction={(action) => {
        if (action === 'zoomIn') setImageView((view) => ({ ...view, scale: Math.min(view.scale + 0.25, 5) }))
        if (action === 'zoomOut') setImageView((view) => ({ ...view, scale: Math.max(view.scale - 0.25, 0.25) }))
        if (action === 'invert') setImageView((view) => ({ ...view, invert: !view.invert }))
        if (action === 'rotate') setImageView((view) => ({ ...view, rotation: view.rotation + 90 }))
        if (action === 'flipHorizontal') setImageView((view) => ({ ...view, flipHorizontal: !view.flipHorizontal }))
        if (action === 'flipVertical') setImageView((view) => ({ ...view, flipVertical: !view.flipVertical }))
        if (action === 'fit') setImageView((view) => ({ ...view, scale: 1, x: 0, y: 0 }))
        if (action === 'reset') setImageView(defaultImageView)
        if (action === 'fullscreen') void imageRoot.current?.requestFullscreen?.()
      }} onViewChange={setImageView} view={imageView} />}
      <div className="min-h-[36rem] overflow-hidden bg-black touch-none" onPointerDown={(event) => {
        dragStart.current = { x: event.clientX - imageView.x, y: event.clientY - imageView.y, pointerId: event.pointerId }
        event.currentTarget.setPointerCapture(event.pointerId)
      }} onPointerMove={(event) => {
        if (dragStart.current?.pointerId === event.pointerId) setImageView((view) => ({ ...view, x: event.clientX - dragStart.current!.x, y: event.clientY - dragStart.current!.y }))
      }} onPointerUp={(event) => {
        if (dragStart.current?.pointerId === event.pointerId) dragStart.current = null
      }} onPointerCancel={(event) => {
        if (dragStart.current?.pointerId === event.pointerId) dragStart.current = null
      }} ref={imageRoot}>
        <img
          alt={imageAsset.name}
          className="min-h-[36rem] w-full select-none bg-black object-contain"
          draggable={false}
          onDragStart={(event) => event.preventDefault()}
          onError={() => setOutcome({ sessionKey, status: 'error' })}
          onLoad={() => setOutcome({ sessionKey, status: 'ready' })}
          src={imageAsset.url}
          style={{ filter: `grayscale(1) brightness(${imageView.brightness}%) contrast(${imageView.contrast}%)${imageView.invert ? ' invert(1)' : ''}`, transform: `translate(${imageView.x}px, ${imageView.y}px) rotate(${imageView.rotation}deg) scale(${imageView.scale * (imageView.flipHorizontal ? -1 : 1)}, ${imageView.scale * (imageView.flipVertical ? -1 : 1)})` }}
        />
      </div>
    </>
  }

export function Viewer({ type, assets }: ViewerProps) {
  const id = useId().replace(/:/g, '')
  const root = useRef<HTMLDivElement>(null)
  const runtime = useRef<ViewerRuntime | null>(null)
  const [outcome, setOutcome] = useState<{ sessionKey: string; status: 'error' | 'ready' } | null>(null)
  const dicomAssets = useMemo(() => assets.filter((asset) => asset.type === 'dicom'), [assets])
  const imageAsset = useMemo(() => assets.find((asset) => asset.type === 'image'), [assets])
  const sessionKey = dicomAssets.length
    ? `${type}:dicom:${dicomAssets.map((asset) => `${asset.id}:${asset.url}`).join('|')}`
    : imageAsset
      ? `${type}:image:${imageAsset.id}:${imageAsset.url}`
      : `${type}:unsupported`
  const status: Status = !assets.length
    ? 'empty'
    : !dicomAssets.length && !imageAsset
      ? 'unsupported'
      : outcome?.sessionKey === sessionKey
        ? outcome.status
        : 'loading'

    useEffect(() => {
    if (!dicomAssets.length || !root.current) return

    let cancelled = false
    void createRuntime({ id, type, imageIds: dicomAssets.map((asset) => `wadouri:${asset.url}`), root: root.current })
      .then((nextRuntime) => {
        if (cancelled) return nextRuntime.destroy()
        runtime.current = nextRuntime
        setOutcome({ sessionKey, status: 'ready' })
      })
      .catch(() => !cancelled && setOutcome({ sessionKey, status: 'error' }))

    return () => {
      cancelled = true
      runtime.current?.destroy()
      runtime.current = null
    }
  }, [dicomAssets, id, sessionKey, type])

  const message = {
    loading: dicomAssets.length ? 'Loading DICOM study…' : 'Loading image…',
    empty: 'No viewer assets were provided.',
    unsupported: 'This viewer supports DICOM and JPG assets only.',
    error: dicomAssets.length ? 'Unable to load this DICOM study.' : 'Unable to load this image.',
    ready: '',
  }[status]

  return <div className="relative overflow-hidden rounded border border-zinc-800 bg-zinc-950">
    {dicomAssets.length ? <>
      {status === 'ready' && <Controls onAction={(action) => runtime.current?.action(action)} />}
      <div ref={root} className={type === 'cbct' ? 'grid min-h-[36rem] grid-cols-2 grid-rows-2 gap-px bg-zinc-800' : 'min-h-[36rem] bg-black'} />
    </> : imageAsset && <ImageViewer key={sessionKey} imageAsset={imageAsset} sessionKey={sessionKey} setOutcome={setOutcome} status={status} />}
    {status !== 'ready' && <div className="absolute inset-0 flex items-center justify-center p-4 text-sm text-zinc-300" role={status === 'error' ? 'alert' : 'status'}>{message}</div>}
  </div>
}

async function createRuntime({ id, type, imageIds, root }: { id: string; type: ViewerProps['type']; imageIds: string[]; root: HTMLDivElement }): Promise<ViewerRuntime> {
  await initialize()
  const cornerstone = await (cornerstonePromise ??= import('@cornerstonejs/core'))
  const tools = await (toolsPromise ??= import('@cornerstonejs/tools'))
  const engineId = `viewer-engine-${id}`
  const groupId = `viewer-tools-${id}`
  const engine = new cornerstone.RenderingEngine(engineId)
  const group = tools.ToolGroupManager.createToolGroup(groupId)
  if (!group) {
    engine.destroy()
    throw new Error('Could not create viewer tool group')
  }

  try {
  const elements = type === 'cbct' ? ['axial', 'coronal', 'sagittal', 'volume'] : ['stack']
  const viewportElements = elements.map((name) => {
    const element = document.createElement('div')
    element.className = 'min-h-0 min-w-0 bg-black'
    root.append(element)
    return [name, element] as const
  })
  const viewportIds = viewportElements.map(([name]) => `${engineId}-${name}`)

  engine.setViewports(viewportElements.map(([name, element]) => ({
    element,
    viewportId: `${engineId}-${name}`,
    type: name === 'stack' ? cornerstone.Enums.ViewportType.STACK : name === 'volume' ? cornerstone.Enums.ViewportType.VOLUME_3D : cornerstone.Enums.ViewportType.ORTHOGRAPHIC,
    defaultOptions: name === 'axial' ? { orientation: cornerstone.Enums.OrientationAxis.AXIAL } : name === 'coronal' ? { orientation: cornerstone.Enums.OrientationAxis.CORONAL } : name === 'sagittal' ? { orientation: cornerstone.Enums.OrientationAxis.SAGITTAL } : undefined,
  })))

  const registeredTools = [tools.PanTool, tools.ZoomTool, tools.WindowLevelTool, tools.StackScrollTool, tools.LengthTool, tools.AngleTool, tools.CrosshairsTool]
  registeredTools.forEach((tool) => group.addTool(tool.toolName))
  viewportIds.forEach((viewportId) => group.addViewport(viewportId, engineId))
  group.setToolActive(tools.WindowLevelTool.toolName, { bindings: [{ mouseButton: tools.Enums.MouseBindings.Primary }] })
  group.setToolActive(tools.StackScrollTool.toolName, { bindings: [{ mouseButton: tools.Enums.MouseBindings.Wheel }] })
  if (type === 'cbct') group.setToolEnabled(tools.CrosshairsTool.toolName)

  if (type === 'radiography') {
    const viewport = engine.getViewport(viewportIds[0])
    if (!(viewport instanceof cornerstone.StackViewport)) throw new Error('Could not create stack viewport')
    await viewport.setStack(imageIds)
  } else {
    const volumeId = `cornerstoneStreamingImageVolume:${engineId}`
    const volume = await cornerstone.volumeLoader.createAndCacheVolume(volumeId, { imageIds })
    await cornerstone.setVolumesForViewports(engine, [{ volumeId }], viewportIds)
    volume.load()
  }
  engine.render()

  const resize = new ResizeObserver(() => engine.resize())
  resize.observe(root)
  const activate = (tool: { toolName: string }) => group.setToolActive(tool.toolName, { bindings: [{ mouseButton: tools.Enums.MouseBindings.Primary }] })
  const action = (name: string) => {
    const viewport = engine.getViewport(viewportIds[0])
        if (!viewport) return
    if (name === 'pan') return activate(tools.PanTool)
    if (name === 'zoom') return activate(tools.ZoomTool)
    if (name === 'windowLevel') return activate(tools.WindowLevelTool)
    if (name === 'scroll') return activate(tools.StackScrollTool)
    if (name === 'length') return activate(tools.LengthTool)
    if (name === 'angle') return activate(tools.AngleTool)
    if (name === 'invert' && viewport instanceof cornerstone.StackViewport) viewport.setProperties({ invert: !viewport.getProperties().invert })
    if (name === 'rotate') viewport.setViewPresentation({ rotation: viewport.getRotation() + 90 })
    if (name === 'flipHorizontal') viewport.setViewPresentation({ flipHorizontal: !viewport.getViewPresentation().flipHorizontal })
    if (name === 'flipVertical') viewport.setViewPresentation({ flipVertical: !viewport.getViewPresentation().flipVertical })
    if (name === 'fit') viewport.resetCamera()
    if (name === 'reset') viewport.reset()
    if (name === 'fullscreen') void root.requestFullscreen?.()
    engine.render()
  }

  return { action, destroy: () => { resize.disconnect(); tools.ToolGroupManager.destroyToolGroup(groupId); engine.destroy(); root.replaceChildren() } }
  } catch (error) {
    tools.ToolGroupManager.destroyToolGroup(groupId)
    engine.destroy()
    root.replaceChildren()
    throw error
  }
}
