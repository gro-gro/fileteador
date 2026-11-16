import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import {
  Asterisk,
  CircleDot,
  Command,
  Download,
  Eye,
  EyeOff,
  Flower2,
  Grid3X3,
  Hand,
  Leaf,
  Minus,
  MousePointer2,
  PanelRightClose,
  PanelRightOpen,
  PenTool,
  Pencil,
  Redo2,
  RotateCcw,
  Save,
  Sparkles,
  Undo2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { CANVAS_H, CANVAS_W, mirrorTransforms, pathFromPoints, sampleAlongPolyline, simplifyPoints } from './geometry'
import type { ArtItem, DetailKind, MirrorMode, PathItem, Point, StrokeStyle, Tool } from './types'

const PRESETS: StrokeStyle[] = [
  { name: 'Carbonero', outer: '#261710', body: '#d64b2a', light: '#ffd76a', shadow: '#722d25', width: 18, contrast: 3, shadowOffset: 6 },
  { name: 'Abasto', outer: '#162b2d', body: '#1f7f79', light: '#f4c75f', shadow: '#993a31', width: 20, contrast: 3, shadowOffset: 7 },
  { name: 'Bandera', outer: '#243755', body: '#78bce5', light: '#fff7db', shadow: '#395f91', width: 19, contrast: 3, shadowOffset: 5 },
  { name: 'Noche', outer: '#111116', body: '#cfaa42', light: '#fff0a6', shadow: '#7d2036', width: 17, contrast: 4, shadowOffset: 7 },
  { name: 'Tinta', outer: '#1d1b18', body: '#eee7d7', light: '#ffffff', shadow: '#777064', width: 14, contrast: 2, shadowOffset: 4 },
]

const defaultItems: ArtItem[] = [
  {
    id: 'bienvenida-1',
    type: 'path',
    name: 'Voluta central',
    points: [
      { x: 480, y: 555 }, { x: 420, y: 535 }, { x: 358, y: 480 }, { x: 332, y: 410 },
      { x: 350, y: 342 }, { x: 405, y: 310 }, { x: 438, y: 338 }, { x: 422, y: 374 }, { x: 385, y: 370 },
    ],
    smoothness: 0.9,
    style: PRESETS[0],
    mirror: 'vertical',
    detail: 'bead',
    detailDensity: 3,
    visible: true,
  },
  {
    id: 'bienvenida-2',
    type: 'path',
    name: 'Arco de guarda',
    points: [{ x: 480, y: 188 }, { x: 423, y: 165 }, { x: 358, y: 176 }, { x: 303, y: 221 }, { x: 278, y: 278 }],
    smoothness: 0.85,
    style: PRESETS[1],
    mirror: 'vertical',
    detail: 'leaf',
    detailDensity: 2,
    visible: true,
  },
  {
    id: 'bienvenida-3',
    type: 'ornament',
    name: 'Flor principal',
    point: { x: 480, y: 238 },
    ornament: 'flower',
    size: 58,
    rotation: 0,
    style: PRESETS[0],
    mirror: 'none',
    visible: true,
  },
]

const toolItems: { id: Tool; label: string; shortcut: string; icon: typeof MousePointer2 }[] = [
  { id: 'select', label: 'Seleccionar', shortcut: 'V', icon: MousePointer2 },
  { id: 'pencil', label: 'Lápiz', shortcut: 'N', icon: Pencil },
  { id: 'pen', label: 'Pluma Bézier', shortcut: 'P', icon: PenTool },
  { id: 'flower', label: 'Flor', shortcut: 'F', icon: Flower2 },
  { id: 'leaf', label: 'Hoja de acanto', shortcut: 'H', icon: Leaf },
]

const mirrorItems: { id: MirrorMode; label: string; glyph: string }[] = [
  { id: 'none', label: 'Libre', glyph: '／' },
  { id: 'vertical', label: 'Espejo vertical', glyph: '◐' },
  { id: 'horizontal', label: 'Espejo horizontal', glyph: '◓' },
  { id: 'quad', label: 'Cuatro ejes', glyph: '✣' },
  { id: 'radial', label: 'Radial x6', glyph: '✺' },
]

function uid() {
  return Math.random().toString(36).slice(2, 9)
}

function flowerShape(style: StrokeStyle, size: number, rotation = 0) {
  const petalW = size * 0.34
  const petalH = size * 0.62
  return (
    <g transform={`rotate(${rotation})`}>
      {Array.from({ length: 8 }, (_, index) => (
        <ellipse
          key={index}
          cx="0"
          cy={-size * 0.32}
          rx={petalW / 2}
          ry={petalH / 2}
          transform={`rotate(${index * 45})`}
          fill={style.body}
          stroke={style.outer}
          strokeWidth={Math.max(1.5, size * 0.055)}
        />
      ))}
      {Array.from({ length: 8 }, (_, index) => (
        <path key={`h-${index}`} d={`M 0 ${-size * 0.1} Q ${size * 0.09} ${-size * 0.28} 0 ${-size * 0.46}`} transform={`rotate(${index * 45})`} fill="none" stroke={style.light} strokeWidth={Math.max(1, size * 0.025)} strokeLinecap="round" />
      ))}
      <circle r={size * 0.2} fill={style.light} stroke={style.outer} strokeWidth={Math.max(1.5, size * 0.055)} />
      <circle r={size * 0.07} fill={style.shadow} />
    </g>
  )
}

function leafShape(style: StrokeStyle, size: number, rotation = 0) {
  return (
    <g transform={`rotate(${rotation})`}>
      <path d={`M ${-size * 0.5} 0 C ${-size * 0.2} ${-size * 0.62}, ${size * 0.38} ${-size * 0.5}, ${size * 0.52} 0 C ${size * 0.12} ${size * 0.05}, ${-size * 0.2} ${size * 0.28}, ${-size * 0.5} 0 Z`} fill={style.body} stroke={style.outer} strokeWidth={Math.max(1.5, size * 0.07)} strokeLinejoin="round" />
      <path d={`M ${-size * 0.39} 0 Q 0 ${-size * 0.1} ${size * 0.42} 0`} fill="none" stroke={style.light} strokeWidth={Math.max(1, size * 0.035)} strokeLinecap="round" />
      <path d={`M ${-size * 0.05} ${-size * 0.08} L ${size * 0.09} ${-size * 0.32} M ${size * 0.12} ${-size * 0.04} L ${size * 0.27} ${-size * 0.24}`} fill="none" stroke={style.outer} strokeWidth={Math.max(1, size * 0.025)} strokeLinecap="round" opacity=".75" />
    </g>
  )
}

function DetailMarks({ item }: { item: PathItem }) {
  if (item.detail === 'none') return null
  const marks = sampleAlongPolyline(item.points, item.detailDensity)
  return marks.map((mark, index) => {
    const size = Math.max(12, item.style.width * 1.45)
    return (
      <g key={`${item.id}-detail-${index}`} transform={`translate(${mark.x} ${mark.y})`}>
        {item.detail === 'flower' && flowerShape(item.style, size, mark.angle)}
        {item.detail === 'leaf' && leafShape(item.style, size * 1.3, mark.angle)}
        {item.detail === 'bead' && <circle r={size * 0.23} fill={item.style.light} stroke={item.style.outer} strokeWidth={Math.max(1.5, size * 0.09)} />}
      </g>
    )
  })
}

function LayeredPath({ item, selected, onSelect }: { item: PathItem; selected: boolean; onSelect: () => void }) {
  const d = pathFromPoints(item.points, item.smoothness)
  const outerWidth = item.style.width + item.style.contrast * 3
  const highlightWidth = Math.max(1.2, item.style.width * 0.17)
  return mirrorTransforms(item.mirror).map((transform, index) => (
    <g key={`${item.id}-${index}`} transform={transform || undefined} opacity={item.visible ? 1 : 0} pointerEvents={item.visible ? 'auto' : 'none'}>
      <path d={d} transform={`translate(${item.style.shadowOffset} ${item.style.shadowOffset})`} fill="none" stroke={item.style.shadow} strokeWidth={outerWidth + 2} strokeLinecap="round" strokeLinejoin="round" opacity=".78" />
      <path d={d} fill="none" stroke={item.style.outer} strokeWidth={outerWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={item.style.body} strokeWidth={item.style.width} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} transform={`translate(${-item.style.width * 0.09} ${-item.style.width * 0.09})`} fill="none" stroke={item.style.light} strokeWidth={highlightWidth} strokeLinecap="round" strokeLinejoin="round" opacity=".95" />
      <path className="hit-path" d={d} fill="none" stroke="transparent" strokeWidth={Math.max(32, outerWidth + 12)} onPointerDown={(event) => { event.stopPropagation(); onSelect() }} />
      <DetailMarks item={item} />
      {selected && index === 0 && <path d={d} fill="none" stroke="#167dff" strokeWidth={1.5} strokeDasharray="5 5" pointerEvents="none" />}
    </g>
  ))
}

function IconButton({ label, onClick, disabled, active, children }: { label: string; onClick: () => void; disabled?: boolean; active?: boolean; children: React.ReactNode }) {
  return <button className={`icon-button ${active ? 'is-active' : ''}`} type="button" aria-label={label} title={label} onClick={onClick} disabled={disabled}>{children}</button>
}

function RangeField({ label, value, min, max, step = 1, suffix = '', onChange }: { label: string; value: number; min: number; max: number; step?: number; suffix?: string; onChange: (value: number) => void }) {
  return (
    <label className="range-field">
      <span><span>{label}</span><output>{value}{suffix}</output></span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  )
}

function App() {
  const [items, setItems] = useState<ArtItem[]>(() => {
    try {
      const saved = localStorage.getItem('fileteador-document-v1')
      if (!saved) return defaultItems
      const parsed = JSON.parse(saved) as ArtItem[]
      const isValid = Array.isArray(parsed) && parsed.every((item) => item && typeof item.id === 'string' && item.style && (
        (item.type === 'ornament' && Number.isFinite(item.point?.x) && Number.isFinite(item.point?.y)) ||
        (item.type === 'path' && Array.isArray(item.points) && item.points.length >= 2 && item.points.every((point) => Number.isFinite(point?.x) && Number.isFinite(point?.y)))
      ))
      return isValid ? parsed : defaultItems
    } catch { return defaultItems }
  })
  const [history, setHistory] = useState<ArtItem[][]>([items])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>('bienvenida-1')
  const [tool, setTool] = useState<Tool>('select')
  const [currentStyle, setCurrentStyle] = useState<StrokeStyle>(PRESETS[0])
  const [mirror, setMirror] = useState<MirrorMode>('vertical')
  const [currentDetail, setCurrentDetail] = useState<DetailKind>('none')
  const [detailDensity, setDetailDensity] = useState(3)
  const [smoothness, setSmoothness] = useState(0.78)
  const [draft, setDraft] = useState<Point[]>([])
  const [penPoints, setPenPoints] = useState<Point[]>([])
  const [penPreview, setPenPreview] = useState<Point | null>(null)
  const [drawing, setDrawing] = useState(false)
  const [nodeDrag, setNodeDrag] = useState<{ id: string; index: number } | null>(null)
  const [zoom, setZoom] = useState(88)
  const [showGrid, setShowGrid] = useState(true)
  const [showInspector, setShowInspector] = useState(true)
  const [toast, setToast] = useState('Documento guardado localmente')
  const svgRef = useRef<SVGSVGElement>(null)
  const itemsRef = useRef(items)
  const toastTimer = useRef<number | null>(null)

  const selected = useMemo(() => items.find((item) => item.id === selectedId) ?? null, [items, selectedId])
  const activeStyle = selected?.style ?? currentStyle
  const activeMirror = selected?.mirror ?? mirror

  useEffect(() => { itemsRef.current = items }, [items])
  useEffect(() => {
    const timer = window.setTimeout(() => localStorage.setItem('fileteador-document-v1', JSON.stringify(items)), 250)
    return () => window.clearTimeout(timer)
  }, [items])

  const notify = (message: string) => {
    setToast(message)
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(''), 2200)
  }

  const commit = (next: ArtItem[]) => {
    setItems(next)
    setHistory((current) => [...current.slice(0, historyIndex + 1), next].slice(-60))
    setHistoryIndex((index) => Math.min(index + 1, 59))
  }

  const undo = () => {
    if (historyIndex <= 0) return
    const nextIndex = historyIndex - 1
    setHistoryIndex(nextIndex)
    setItems(history[nextIndex])
  }

  const redo = () => {
    if (historyIndex >= history.length - 1) return
    const nextIndex = historyIndex + 1
    setHistoryIndex(nextIndex)
    setItems(history[nextIndex])
  }

  const updateSelected = (updater: (item: ArtItem) => ArtItem) => {
    if (!selectedId) return
    commit(items.map((item) => item.id === selectedId ? updater(item) : item))
  }

  const updateStyle = (patch: Partial<StrokeStyle>) => {
    const next = { ...activeStyle, ...patch, name: patch.name ?? 'Personalizado' }
    if (selected) updateSelected((item) => ({ ...item, style: next }))
    else setCurrentStyle(next)
  }

  const pointFromEvent = (event: ReactPointerEvent<SVGSVGElement>): Point => {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const point = svg.createSVGPoint()
    point.x = event.clientX
    point.y = event.clientY
    const mapped = point.matrixTransform(svg.getScreenCTM()?.inverse())
    return { x: mapped.x, y: mapped.y }
  }

  const addPath = (points: Point[]) => {
    if (points.length < 2) return
    const item: PathItem = {
      id: uid(), type: 'path', name: `Filete ${items.length + 1}`, points, smoothness,
      style: { ...currentStyle }, mirror, detail: currentDetail, detailDensity, visible: true,
    }
    commit([...items, item])
    setSelectedId(item.id)
    setTool('select')
    notify('Curva fileteada · lista para ajustar')
  }

  const finishPen = () => {
    const clean = penPoints.filter((point, index, all) => index === 0 || Math.hypot(point.x - all[index - 1].x, point.y - all[index - 1].y) > 3)
    addPath(clean)
    setPenPoints([])
    setPenPreview(null)
  }

  const onCanvasPointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    const point = pointFromEvent(event)
    if (tool === 'pencil') {
      event.currentTarget.setPointerCapture(event.pointerId)
      setDrawing(true)
      setDraft([point])
      return
    }
    if (tool === 'pen') {
      setPenPoints((current) => [...current, point])
      return
    }
    if (tool === 'flower' || tool === 'leaf') {
      const item: ArtItem = {
        id: uid(), type: 'ornament', name: tool === 'flower' ? 'Flor' : 'Hoja de acanto', point,
        ornament: tool, size: tool === 'flower' ? 52 : 62, rotation: 0, style: { ...currentStyle }, mirror, visible: true,
      }
      commit([...items, item])
      setSelectedId(item.id)
      setTool('select')
      notify(`${item.name} agregada`)
      return
    }
    setSelectedId(null)
  }

  const onCanvasPointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    const point = pointFromEvent(event)
    if (drawing) {
      setDraft((current) => [...current, point])
      return
    }
    if (nodeDrag) {
      setItems((current) => current.map((item) => item.id === nodeDrag.id && item.type === 'path'
        ? { ...item, points: item.points.map((node, index) => index === nodeDrag.index ? point : node) }
        : item))
      return
    }
    if (tool === 'pen' && penPoints.length) setPenPreview(point)
  }

  const onCanvasPointerUp = () => {
    if (drawing) {
      const points = simplifyPoints(draft, 7)
      setDrawing(false)
      setDraft([])
      addPath(points)
    }
    if (nodeDrag) {
      setNodeDrag(null)
      commit(itemsRef.current)
    }
  }

  const selectPreset = (preset: StrokeStyle) => {
    if (selected) updateSelected((item) => ({ ...item, style: { ...preset } }))
    else setCurrentStyle({ ...preset })
  }

  const setActiveMirror = (next: MirrorMode) => {
    if (selected) updateSelected((item) => ({ ...item, mirror: next }))
    else setMirror(next)
  }

  const exportSvg = () => {
    const svg = svgRef.current
    if (!svg) return
    const clone = svg.cloneNode(true) as SVGSVGElement
    clone.querySelectorAll('[data-ui]').forEach((node) => node.remove())
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    clone.setAttribute('width', String(CANVAS_W))
    clone.setAttribute('height', String(CANVAS_H))
    const blob = new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'mi-fileteado.svg'
    document.body.appendChild(link)
    link.click()
    window.setTimeout(() => { URL.revokeObjectURL(link.href); link.remove() }, 10_000)
    notify('SVG vectorial exportado')
  }

  const exportPng = () => {
    const svg = svgRef.current
    if (!svg) return
    const clone = svg.cloneNode(true) as SVGSVGElement
    clone.querySelectorAll('[data-ui]').forEach((node) => node.remove())
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    const source = new XMLSerializer().serializeToString(clone)
    const image = new Image()
    const url = URL.createObjectURL(new Blob([source], { type: 'image/svg+xml' }))
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = CANVAS_W * 2
      canvas.height = CANVAS_H * 2
      const context = canvas.getContext('2d')
      context?.drawImage(image, 0, 0, canvas.width, canvas.height)
      canvas.toBlob((blob) => {
        if (!blob) return
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = 'mi-fileteado@2x.png'
        document.body.appendChild(link)
        link.click()
        window.setTimeout(() => { URL.revokeObjectURL(link.href); link.remove() }, 10_000)
      }, 'image/png')
      URL.revokeObjectURL(url)
    }
    image.src = url
    notify('PNG @2x exportado')
  }

  const resetDocument = () => {
    commit(defaultItems)
    setSelectedId('bienvenida-1')
    notify('Volviste a la pieza de muestra')
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      if (target.matches('input, textarea')) return
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        if (event.shiftKey) redo(); else undo()
        return
      }
      const key = event.key.toLowerCase()
      const shortcuts: Partial<Record<string, Tool>> = { v: 'select', n: 'pencil', p: 'pen', f: 'flower', h: 'leaf' }
      if (shortcuts[key]) setTool(shortcuts[key]!)
      if (event.key === 'Enter' && penPoints.length) finishPen()
      if (event.key === 'Escape') { setPenPoints([]); setDraft([]); setTool('select') }
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedId) {
        commit(items.filter((item) => item.id !== selectedId)); setSelectedId(null)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  const selectedPath = selected?.type === 'path' ? selected : null
  const selectedOrnament = selected?.type === 'ornament' ? selected : null

  return (
    <div className="app-shell">
      <a className="skip-link" href="#drawing-workspace">Saltar al lienzo</a>
      <header className="topbar">
        <div className="brand" aria-label="Fileteador">
          <span className="brand-mark"><Sparkles size={17} strokeWidth={1.8} /></span>
          <div><strong>FILETEADOR</strong><small>TALLER VECTORIAL PORTEÑO</small></div>
        </div>
        <div className="document-title"><span className="save-dot" /> Mi fileteado <span>/</span> Mesa 01</div>
        <nav className="top-actions" aria-label="Acciones del documento">
          <IconButton label="Deshacer (Ctrl+Z)" onClick={undo} disabled={historyIndex <= 0}><Undo2 size={17} /></IconButton>
          <IconButton label="Rehacer (Ctrl+Shift+Z)" onClick={redo} disabled={historyIndex >= history.length - 1}><Redo2 size={17} /></IconButton>
          <span className="top-divider" />
          <IconButton label="Mostrar cuadrícula" onClick={() => setShowGrid((value) => !value)} active={showGrid}><Grid3X3 size={17} /></IconButton>
          <button className="export-button" type="button" onClick={exportSvg}><Download size={16} /> Exportar SVG</button>
          <button className="more-export" type="button" onClick={exportPng} aria-label="Exportar PNG" title="Exportar PNG @2x">PNG</button>
        </nav>
      </header>

      <main id="drawing-workspace" className={`workspace ${showInspector ? '' : 'inspector-closed'}`}>
        <aside className="toolrail" aria-label="Herramientas de dibujo">
          <div className="tool-group">
            {toolItems.map((item) => {
              const Icon = item.icon
              return (
                <button key={item.id} type="button" className={`tool-button ${tool === item.id ? 'is-active' : ''}`} onClick={() => setTool(item.id)} title={`${item.label} (${item.shortcut})`} aria-label={`${item.label}, atajo ${item.shortcut}`}>
                  <Icon size={20} strokeWidth={1.75} /><span>{item.shortcut}</span>
                </button>
              )
            })}
          </div>
          <div className="tool-group rail-bottom">
            <IconButton label="Mano" onClick={() => notify('Usá la rueda o los controles para acercar')}><Hand size={19} /></IconButton>
            <IconButton label="Restaurar pieza de muestra" onClick={resetDocument}><RotateCcw size={18} /></IconButton>
          </div>
        </aside>

        <section className="stage" aria-label="Mesa de dibujo">
          <div className="contextbar">
            <div className="crumb"><span className="tool-orb">{tool === 'pen' ? <PenTool size={14} /> : tool === 'pencil' ? <Pencil size={14} /> : <MousePointer2 size={14} />}</span><strong>{toolItems.find((item) => item.id === tool)?.label}</strong><span className="context-hint">{tool === 'pen' ? 'Clic para anclas · Enter para terminar' : tool === 'pencil' ? 'Arrastrá para dibujar' : 'Elegí una curva para editarla'}</span></div>
            <button type="button" className="inspector-toggle" onClick={() => setShowInspector((value) => !value)} aria-label={showInspector ? 'Ocultar inspector' : 'Mostrar inspector'}>
              {showInspector ? <PanelRightClose size={17} /> : <PanelRightOpen size={17} />}
            </button>
          </div>

          <div className={`canvas-scroll tool-${tool}`}>
            <div className="canvas-wrap" style={{ width: `${zoom}%` }}>
              <svg
                ref={svgRef}
                className="artboard"
                viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
                role="img"
                aria-label="Lienzo vectorial de fileteado"
                onPointerDown={onCanvasPointerDown}
                onPointerMove={onCanvasPointerMove}
                onPointerUp={onCanvasPointerUp}
                onPointerLeave={onCanvasPointerUp}
                onDoubleClick={() => tool === 'pen' && finishPen()}
              >
                <defs>
                  <pattern id="smallGrid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="#83765e" strokeWidth=".55" opacity=".18" /></pattern>
                  <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse"><rect width="100" height="100" fill="url(#smallGrid)" /><path d="M 100 0 L 0 0 0 100" fill="none" stroke="#766b56" strokeWidth=".8" opacity=".22" /></pattern>
                  <filter id="paperNoise" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency=".78" numOctaves="3" seed="11" result="noise" /><feColorMatrix in="noise" type="saturate" values="0" /><feComponentTransfer><feFuncA type="table" tableValues="0 .035" /></feComponentTransfer></filter>
                </defs>
                <rect width={CANVAS_W} height={CANVAS_H} fill="#f0e8d7" />
                <rect width={CANVAS_W} height={CANVAS_H} fill={showGrid ? 'url(#grid)' : 'transparent'} />
                <rect width={CANVAS_W} height={CANVAS_H} filter="url(#paperNoise)" opacity=".5" pointerEvents="none" />
                <g className="corner-marks" opacity=".65" pointerEvents="none">
                  <path d="M 32 58 L 32 32 L 58 32 M 902 32 L 928 32 L 928 58 M 928 622 L 928 648 L 902 648 M 58 648 L 32 648 L 32 622" fill="none" stroke="#8e8168" strokeWidth="1.2" />
                </g>
                {items.map((item) => {
                  if (item.type === 'path') return <LayeredPath key={item.id} item={item} selected={selectedId === item.id} onSelect={() => { setSelectedId(item.id); setTool('select') }} />
                  return mirrorTransforms(item.mirror).map((transform, index) => (
                    <g key={`${item.id}-${index}`} transform={transform || undefined} opacity={item.visible ? 1 : 0} pointerEvents={item.visible ? 'auto' : 'none'} onPointerDown={(event) => { event.stopPropagation(); setSelectedId(item.id); setTool('select') }}>
                      <g transform={`translate(${item.point.x} ${item.point.y})`} className={selectedId === item.id && index === 0 ? 'selected-ornament' : ''}>
                        {item.ornament === 'flower' ? flowerShape(item.style, item.size, item.rotation) : leafShape(item.style, item.size, item.rotation)}
                        <circle className="ornament-hit" r={item.size * .75} fill="transparent" />
                      </g>
                    </g>
                  ))
                })}
                {draft.length > 1 && <path data-ui d={pathFromPoints(draft, smoothness)} fill="none" stroke={currentStyle.body} strokeWidth={currentStyle.width} strokeLinecap="round" strokeLinejoin="round" opacity=".75" />}
                {penPoints.length > 0 && (
                  <g data-ui pointerEvents="none">
                    <path d={pathFromPoints(penPreview ? [...penPoints, penPreview] : penPoints, smoothness)} fill="none" stroke={currentStyle.body} strokeWidth={currentStyle.width} strokeLinecap="round" opacity=".7" />
                    {penPoints.map((point, index) => <circle key={index} cx={point.x} cy={point.y} r="4.5" fill="#f7f2e7" stroke="#167dff" strokeWidth="2" />)}
                  </g>
                )}
                {selectedPath && (
                  <g data-ui className="nodes">
                    {selectedPath.points.map((point, index) => (
                      <circle key={index} cx={point.x} cy={point.y} r="5.5" fill="#f9f4e9" stroke="#167dff" strokeWidth="2.2" onPointerDown={(event) => { event.stopPropagation(); (event.currentTarget as SVGCircleElement).setPointerCapture(event.pointerId); setNodeDrag({ id: selectedPath.id, index }) }} />
                    ))}
                  </g>
                )}
                {activeMirror !== 'none' && (
                  <g data-ui className="mirror-guides" pointerEvents="none">
                    {(activeMirror === 'vertical' || activeMirror === 'quad') && <line x1={CANVAS_W / 2} x2={CANVAS_W / 2} y1="28" y2={CANVAS_H - 28} />}
                    {(activeMirror === 'horizontal' || activeMirror === 'quad') && <line x1="28" x2={CANVAS_W - 28} y1={CANVAS_H / 2} y2={CANVAS_H / 2} />}
                    {activeMirror === 'radial' && Array.from({ length: 3 }, (_, index) => <line key={index} x1={CANVAS_W / 2} y1={CANVAS_H / 2} x2={CANVAS_W / 2} y2="24" transform={`rotate(${index * 60} ${CANVAS_W / 2} ${CANVAS_H / 2})`} />)}
                  </g>
                )}
              </svg>
            </div>
          </div>

          <div className="statusbar">
            <div><span className="status-chip">SVG</span><span>{items.length} elementos</span><span>{selectedPath ? `${selectedPath.points.length} anclas` : selectedOrnament ? 'Ornamento' : 'Sin selección'}</span></div>
            <div className="zoom-control"><ZoomOut size={14} /><input aria-label="Zoom del lienzo" type="range" min="55" max="130" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} /><span>{zoom}%</span><ZoomIn size={14} /></div>
          </div>
        </section>

        {showInspector && (
          <aside className="inspector" aria-label="Inspector de fileteado">
            <section className="panel-section intro-section">
              <div className="eyebrow"><span /> TRATAMIENTO DE CURVA</div>
              <h1>{selected ? selected.name : 'Nuevo filete'}</h1>
              <p>{selected ? 'Ajustá el carácter de la selección.' : 'Dibujá una curva para aplicarle el oficio.'}</p>
            </section>

            <section className="panel-section">
              <div className="section-heading"><span>Estilo</span><small>{activeStyle.name}</small></div>
              <div className="preset-grid">
                {PRESETS.map((preset) => (
                  <button key={preset.name} type="button" className={`preset ${activeStyle.name === preset.name ? 'is-active' : ''}`} onClick={() => selectPreset(preset)} title={preset.name} aria-label={`Estilo ${preset.name}`}>
                    <span style={{ background: preset.outer }}><i style={{ background: preset.body, borderColor: preset.light }} /></span><em>{preset.name}</em>
                  </button>
                ))}
              </div>
            </section>

            <section className="panel-section">
              <div className="section-heading"><span>Construcción</span><small>Capas de oficio</small></div>
              <RangeField label="Cuerpo" value={activeStyle.width} min={5} max={42} suffix=" px" onChange={(value) => updateStyle({ width: value })} />
              <RangeField label="Contraste" value={activeStyle.contrast} min={1} max={7} onChange={(value) => updateStyle({ contrast: value })} />
              <RangeField label="Sombra" value={activeStyle.shadowOffset} min={0} max={16} suffix=" px" onChange={(value) => updateStyle({ shadowOffset: value })} />
              {selectedPath && <RangeField label="Curvatura" value={Math.round(selectedPath.smoothness * 100)} min={0} max={100} suffix="%" onChange={(value) => updateSelected((item) => item.type === 'path' ? { ...item, smoothness: value / 100 } : item)} />}
              {!selected && <RangeField label="Curvatura" value={Math.round(smoothness * 100)} min={0} max={100} suffix="%" onChange={(value) => setSmoothness(value / 100)} />}
              <div className="color-row">
                {([['outer', 'Borde'], ['body', 'Cuerpo'], ['light', 'Luz'], ['shadow', 'Sombra']] as const).map(([key, label]) => (
                  <label key={key} title={`${label}: ${activeStyle[key]}`}><input type="color" name={`color-${key}`} autoComplete="off" value={activeStyle[key]} onChange={(event) => updateStyle({ [key]: event.target.value })} /><span>{label}</span></label>
                ))}
              </div>
            </section>

            {selected?.type !== 'ornament' && (
              <section className="panel-section">
                <div className="section-heading"><span>Detalles sobre curva</span><small>Opcional</small></div>
                <div className="segmented detail-segmented">
                  {([{ id: 'none', label: 'Nada', icon: Minus }, { id: 'flower', label: 'Flores', icon: Flower2 }, { id: 'leaf', label: 'Acanto', icon: Leaf }, { id: 'bead', label: 'Bolitas', icon: CircleDot }] as { id: DetailKind; label: string; icon: typeof Minus }[]).map((detail) => {
                    const Icon = detail.icon
                    const value = selectedPath?.detail ?? currentDetail
                    return <button key={detail.id} type="button" className={value === detail.id ? 'is-active' : ''} onClick={() => selectedPath ? updateSelected((item) => item.type === 'path' ? { ...item, detail: detail.id } : item) : setCurrentDetail(detail.id)}><Icon size={15} /><span>{detail.label}</span></button>
                  })}
                </div>
                {(selectedPath?.detail ?? currentDetail) !== 'none' && <RangeField label="Cantidad" value={selectedPath?.detailDensity ?? detailDensity} min={1} max={8} onChange={(value) => selectedPath ? updateSelected((item) => item.type === 'path' ? { ...item, detailDensity: value } : item) : setDetailDensity(value)} />}
              </section>
            )}

            <section className="panel-section">
              <div className="section-heading"><span>Espejos</span><small>En vivo</small></div>
              <div className="mirror-grid">
                {mirrorItems.map((item) => <button key={item.id} type="button" className={activeMirror === item.id ? 'is-active' : ''} onClick={() => setActiveMirror(item.id)} title={item.label} aria-label={item.label}><b aria-hidden="true">{item.glyph}</b><span>{item.label}</span></button>)}
              </div>
            </section>

            {selectedOrnament && (
              <section className="panel-section">
                <div className="section-heading"><span>Ornamento</span><small>{selectedOrnament.ornament === 'flower' ? 'Flor' : 'Acanto'}</small></div>
                <RangeField label="Tamaño" value={selectedOrnament.size} min={18} max={140} suffix=" px" onChange={(value) => updateSelected((item) => item.type === 'ornament' ? { ...item, size: value } : item)} />
                <RangeField label="Rotación" value={selectedOrnament.rotation} min={-180} max={180} suffix="°" onChange={(value) => updateSelected((item) => item.type === 'ornament' ? { ...item, rotation: value } : item)} />
              </section>
            )}

            <section className="panel-section layers-section">
              <div className="section-heading"><span>Elementos</span><small>{items.length}</small></div>
              <div className="layers">
                {[...items].reverse().map((item) => (
                  <div key={item.id} className={`layer-row ${selectedId === item.id ? 'is-active' : ''}`}>
                    <button type="button" className="layer-select" onClick={() => { setSelectedId(item.id); setTool('select') }}>
                      <span className="layer-icon">{item.type === 'path' ? <Asterisk size={14} /> : item.ornament === 'flower' ? <Flower2 size={14} /> : <Leaf size={14} />}</span>
                      <span className="layer-name">{item.name}</span>
                    </button>
                    <button type="button" className="layer-eye" aria-label={item.visible ? `Ocultar ${item.name}` : `Mostrar ${item.name}`} onClick={() => commit(items.map((current) => current.id === item.id ? { ...current, visible: !current.visible } : current))}>{item.visible ? <Eye size={14} /> : <EyeOff size={14} />}</button>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        )}
      </main>

      <div className={`toast ${toast ? 'is-visible' : ''}`} role="status"><Save size={14} /> {toast}</div>
      <div className="shortcut-note"><Command size={13} /> Atajos activos</div>
    </div>
  )
}

export default App
