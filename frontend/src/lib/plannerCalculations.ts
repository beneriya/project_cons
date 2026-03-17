export type LayoutPattern = 'straight-h' | 'straight-v' | 'diagonal'

export interface PlannerResult {
  totalArea: number
  areaWithWaste: number
  tilesNeeded: number
  boxesNeeded: number
  totalCost: number
}

const PATTERN_WASTE_BONUS: Record<LayoutPattern, number> = {
  'straight-h': 0,
  'straight-v': 0,
  diagonal: 10,
}

export function calculateMaterials(
  widthM: number,
  heightM: number,
  m2PerBox: number,
  piecesPerBox: number,
  pricePerBox: number,
  wastePercent: number,
  pattern: LayoutPattern = 'straight-h'
): PlannerResult {
  const totalArea = widthM * heightM
  const patternWaste = PATTERN_WASTE_BONUS[pattern] ?? 0
  const effectiveWaste = Math.min(50, wastePercent + patternWaste)
  const wasteMultiplier = 1 + effectiveWaste / 100
  const areaWithWaste = totalArea * wasteMultiplier
  const boxesNeeded = Math.ceil(areaWithWaste / m2PerBox)
  const tilesNeeded = boxesNeeded * piecesPerBox
  const totalCost = boxesNeeded * pricePerBox

  return {
    totalArea,
    areaWithWaste,
    tilesNeeded,
    boxesNeeded,
    totalCost,
  }
}

export const ROOM_PRESETS = [
  { label: 'Square (4×4)', width: 4, height: 4 },
  { label: 'Living Room (5×4)', width: 5, height: 4 },
  { label: 'Bedroom (4×3)', width: 4, height: 3 },
  { label: 'Hallway (8×1.5)', width: 8, height: 1.5 },
] as const

/** Plank layout for visualization - position, size, rotation, cut info */
export interface PlankData {
  x: number
  y: number
  length: number
  width: number
  rotation: number // radians
  isCut: boolean
  /** Sides that are cut (extend beyond room): left, right, top, bottom in plank-local coords */
  cutSides: { left?: boolean; right?: boolean; top?: boolean; bottom?: boolean }
  /** Clipped bounds for 2D drawing: [x1,y1, x2,y2] in room coords - for cut planks */
  clippedBounds?: [number, number, number, number]
}

/** Parquet plank aspect ratio (length:width). 5:1 is typical for strip flooring */
export const PLANK_ASPECT = 5

/** Compute plank length/width from area per piece (m²). Exported for testing. */
export function getPlankDimensions(m2PerPiece: number): { length: number; width: number } {
  const area = m2PerPiece
  const length = Math.sqrt(area * PLANK_ASPECT)
  const width = area / length
  return { length, width }
}

/** Test if rect (x,y,w,h) with optional rotation intersects room. Returns clipped bounds or null. Exported for testing. */
export function rectIntersectsRoom(
  x: number,
  y: number,
  w: number,
  h: number,
  roomW: number,
  roomH: number,
  rot: number
): { clipped: [number, number, number, number]; isCut: boolean } | null {
  if (rot === 0) {
    const x1 = Math.max(0, x)
    const y1 = Math.max(0, y)
    const x2 = Math.min(roomW, x + w)
    const y2 = Math.min(roomH, y + h)
    if (x1 >= x2 || y1 >= y2) return null
    const isCut = x < 0 || y < 0 || x + w > roomW || y + h > roomH
    return { clipped: [x1, y1, x2, y2], isCut }
  }
  // For rotated rects: (x,y) is one corner; center = corner + rotate(w/2, h/2)
  const cos = Math.cos(rot)
  const sin = Math.sin(rot)
  const cx = x + (w / 2) * cos - (h / 2) * sin
  const cy = y + (w / 2) * sin + (h / 2) * cos
  const cosAbs = Math.abs(cos)
  const sinAbs = Math.abs(sin)
  const bx = (w * cosAbs + h * sinAbs) / 2
  const by = (w * sinAbs + h * cosAbs) / 2
  const margin = 1.5
  const inRoom =
    cx >= -bx * margin && cx <= roomW + bx * margin &&
    cy >= -by * margin && cy <= roomH + by * margin
  if (!inRoom) return null
  const isCut = x < -0.01 || y < -0.01 || x + w > roomW + 0.01 || y + h > roomH + 0.01
  // Axis-aligned bbox of rotated rect corners, clamped to room (for display; exact intersection is complex)
  const c0x = x
  const c0y = y
  const c1x = x + w * cos
  const c1y = y + w * sin
  const c2x = x + w * cos - h * sin
  const c2y = y + w * sin + h * cos
  const c3x = x - h * sin
  const c3y = y + h * cos
  const xMin = Math.max(0, Math.min(c0x, c1x, c2x, c3x))
  const xMax = Math.min(roomW, Math.max(c0x, c1x, c2x, c3x))
  const yMin = Math.max(0, Math.min(c0y, c1y, c2y, c3y))
  const yMax = Math.min(roomH, Math.max(c0y, c1y, c2y, c3y))
  if (xMax <= xMin || yMax <= yMin) return null
  return { clipped: [xMin, yMin, xMax, yMax], isCut }
}

/** Max room dimension (m) for visual preview - larger rooms cause lag. Exported for UI. */
export const MAX_ROOM_DIM = 50

/** Generate plank layout for visualization. Room is width x height in meters, origin bottom-left. */
export function generatePlankLayout(
  roomWidth: number,
  roomHeight: number,
  m2PerBox: number,
  piecesPerBox: number,
  pattern: LayoutPattern
): PlankData[] {
  const w = Math.min(roomWidth, MAX_ROOM_DIM)
  const h = Math.min(roomHeight, MAX_ROOM_DIM)
  const { length: plankLen, width: plankW } = getPlankDimensions(m2PerBox / piecesPerBox)
  const planks: PlankData[] = []
  const pad = Math.max(plankLen, plankW) * 2
  // 50×50 room with 0.2m planks needs ~12,500; allow headroom for diagonal waste
  const MAX_PLANKS = 25000
  const shouldStop = () => planks.length >= MAX_PLANKS

  if (pattern === 'straight-h') {
    let row = 0
    for (let y = -plankW; y < h + pad && !shouldStop(); y += plankW, row++) {
      const offset = (row % 2) * (plankLen / 2)
      for (let x = -plankLen; x < w + pad && !shouldStop(); x += plankLen) {
        const px = x + offset
        const r = rectIntersectsRoom(px, y, plankLen, plankW, w, h, 0)
        if (!r) continue
        const cutSides = {
          left: px < 0,
          right: px + plankLen > w,
          top: y + plankW > h,
          bottom: y < 0,
        }
        planks.push({
          x: px + plankLen / 2,
          y: y + plankW / 2,
          length: plankLen,
          width: plankW,
          rotation: 0,
          isCut: r.isCut,
          cutSides,
          clippedBounds: r.clipped ?? undefined,
        })
      }
    }
  } else if (pattern === 'straight-v') {
    let col = 0
    for (let x = -plankW; x < w + pad && !shouldStop(); x += plankW, col++) {
      const offset = (col % 2) * (plankLen / 2)
      for (let y = -plankLen; y < h + pad && !shouldStop(); y += plankLen) {
        const py = y + offset
        const r = rectIntersectsRoom(x, py, plankW, plankLen, w, h, 0)
        if (!r) continue
        const cutSides = {
          left: x < 0,
          right: x + plankW > w,
          top: py + plankLen > h,
          bottom: py < 0,
        }
        planks.push({
          x: x + plankW / 2,
          y: py + plankLen / 2,
          length: plankLen,
          width: plankW,
          rotation: Math.PI / 2,
          isCut: r.isCut,
          cutSides,
          clippedBounds: r.clipped ?? undefined,
        })
      }
    }
  } else if (pattern === 'diagonal') {
    const c = Math.cos(Math.PI / 4)
    const s = Math.sin(Math.PI / 4)
    const ux = plankLen * c
    const uy = plankLen * s
    const vx = -plankW * s
    const vy = plankW * c
    const diag = Math.sqrt(w * w + h * h) + plankLen * 4
    const nU = Math.min(Math.ceil(diag / plankLen) + 12, 250)
    const nV = Math.min(Math.ceil(diag / plankW) + 12, 250)
    for (let i = -nV; i <= nV && !shouldStop(); i++) {
      for (let j = -nU; j <= nU && !shouldStop(); j++) {
        const cx = j * ux + i * vx
        const cy = j * uy + i * vy
        const topLeftX = cx - (plankLen / 2) * c + (plankW / 2) * s
        const topLeftY = cy - (plankLen / 2) * s - (plankW / 2) * c
        const r = rectIntersectsRoom(topLeftX, topLeftY, plankLen, plankW, w, h, Math.PI / 4)
        if (!r) continue
        planks.push({
          x: cx,
          y: cy,
          length: plankLen,
          width: plankW,
          rotation: Math.PI / 4,
          isCut: r.isCut,
          cutSides: {},
          clippedBounds: r.clipped ?? undefined,
        })
      }
    }
  }

  const filtered = planks.filter((p) => {
    if (p.clippedBounds) {
      const [x1, y1, x2, y2] = p.clippedBounds
      return x2 - x1 > 0.01 && y2 - y1 > 0.01
    }
    return true
  })

  const seen = new Set<string>()
  return filtered.filter((p) => {
    const key = `${Math.round(p.x * 10000)}_${Math.round(p.y * 10000)}_${p.rotation.toFixed(4)}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
