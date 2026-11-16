import type { MirrorMode, Point } from './types'

export const CANVAS_W = 960
export const CANVAS_H = 680

export function pathFromPoints(points: Point[], smoothness = 0.65) {
  if (points.length === 0) return ''
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`
  if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`

  const tension = Math.max(0, Math.min(1, smoothness)) / 6
  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] ?? p2
    const c1 = { x: p1.x + (p2.x - p0.x) * tension, y: p1.y + (p2.y - p0.y) * tension }
    const c2 = { x: p2.x - (p3.x - p1.x) * tension, y: p2.y - (p3.y - p1.y) * tension }
    d += ` C ${c1.x.toFixed(1)} ${c1.y.toFixed(1)}, ${c2.x.toFixed(1)} ${c2.y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
  }
  return d
}

export function simplifyPoints(points: Point[], minDistance = 5) {
  if (points.length <= 2) return points
  const kept = [points[0]]
  for (let i = 1; i < points.length - 1; i += 1) {
    const last = kept[kept.length - 1]
    if (Math.hypot(points[i].x - last.x, points[i].y - last.y) >= minDistance) kept.push(points[i])
  }
  kept.push(points[points.length - 1])
  return kept
}

export function mirrorTransforms(mode: MirrorMode) {
  if (mode === 'vertical') return ['', `translate(${CANVAS_W} 0) scale(-1 1)`]
  if (mode === 'horizontal') return ['', `translate(0 ${CANVAS_H}) scale(1 -1)`]
  if (mode === 'quad') return ['', `translate(${CANVAS_W} 0) scale(-1 1)`, `translate(0 ${CANVAS_H}) scale(1 -1)`, `translate(${CANVAS_W} ${CANVAS_H}) scale(-1 -1)`]
  if (mode === 'radial') return Array.from({ length: 6 }, (_, i) => `rotate(${i * 60} ${CANVAS_W / 2} ${CANVAS_H / 2})`)
  return ['']
}

export function sampleAlongPolyline(points: Point[], count: number) {
  if (points.length < 2 || count <= 0) return []
  const lengths: number[] = []
  let total = 0
  for (let i = 1; i < points.length; i += 1) {
    total += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y)
    lengths.push(total)
  }
  return Array.from({ length: count }, (_, index) => {
    const target = ((index + 1) / (count + 1)) * total
    let segment = lengths.findIndex((length) => length >= target)
    if (segment < 0) segment = lengths.length - 1
    const prior = segment === 0 ? 0 : lengths[segment - 1]
    const start = points[segment]
    const end = points[segment + 1]
    const t = (target - prior) / Math.max(1, lengths[segment] - prior)
    return {
      x: start.x + (end.x - start.x) * t,
      y: start.y + (end.y - start.y) * t,
      angle: Math.atan2(end.y - start.y, end.x - start.x) * (180 / Math.PI),
    }
  })
}
