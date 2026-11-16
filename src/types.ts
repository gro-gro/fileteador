export type Point = { x: number; y: number }
export type Tool = 'select' | 'pencil' | 'pen' | 'flower' | 'leaf'
export type MirrorMode = 'none' | 'vertical' | 'horizontal' | 'quad' | 'radial'
export type DetailKind = 'none' | 'flower' | 'leaf' | 'bead'

export type StrokeStyle = {
  name: string
  outer: string
  body: string
  light: string
  shadow: string
  width: number
  contrast: number
  shadowOffset: number
}

export type PathItem = {
  id: string
  type: 'path'
  name: string
  points: Point[]
  smoothness: number
  style: StrokeStyle
  mirror: MirrorMode
  detail: DetailKind
  detailDensity: number
  visible: boolean
}

export type OrnamentItem = {
  id: string
  type: 'ornament'
  name: string
  point: Point
  ornament: Exclude<DetailKind, 'none' | 'bead'>
  size: number
  rotation: number
  style: StrokeStyle
  mirror: MirrorMode
  visible: boolean
}

export type ArtItem = PathItem | OrnamentItem
