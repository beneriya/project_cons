/**
 * Polygon-based room geometry: area calculation, point-in-polygon test,
 * plank generation clipped to arbitrary room shapes.
 */

import { getPlankDimensions, type LayoutPattern, type PlankData } from './plannerCalculations'

// ── Types ──────────────────────────────────────────────────────────────────

export interface Point {
  x: number
  y: number
}

/** A room defined by a closed polygon (vertices in order, no self-intersections) */
export interface PolygonRoom {
  vertices: Point[]
}

// ── Presets: common real-world room shapes ─────────────────────────────────

export const POLYGON_PRESETS: { label: string; vertices: Point[] }[] = [
  {
    label: 'Тэгш өнцөгт (5×4)',
    vertices: [
      { x: 0, y: 0 },
      { x: 5, y: 0 },
      { x: 5, y: 4 },
      { x: 0, y: 4 },
    ],
  },
  {
    label: 'L хэлбэр',
    vertices: [
      { x: 0, y: 0 },
      { x: 6, y: 0 },
      { x: 6, y: 2.5 },
      { x: 3, y: 2.5 },
      { x: 3, y: 4 },
      { x: 0, y: 4 },
    ],
  },
  {
    label: 'T хэлбэр',
    vertices: [
      { x: 1.5, y: 0 },
      { x: 4.5, y: 0 },
      { x: 4.5, y: 2 },
      { x: 6, y: 2 },
      { x: 6, y: 4 },
      { x: 0, y: 4 },
      { x: 0, y: 2 },
      { x: 1.5, y: 2 },
    ],
  },
  {
    label: 'U хэлбэр',
    vertices: [
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      { x: 2, y: 2.5 },
      { x: 4, y: 2.5 },
      { x: 4, y: 0 },
      { x: 6, y: 0 },
      { x: 6, y: 4 },
      { x: 0, y: 4 },
    ],
  },
  {
    label: 'Булангийн таслалт',
    vertices: [
      { x: 0, y: 0 },
      { x: 5, y: 0 },
      { x: 5, y: 4 },
      { x: 2, y: 4 },
      { x: 0, y: 2 },
    ],
  },
  {
    label: 'Коридор + өрөө',
    vertices: [
      { x: 0, y: 0 },
      { x: 8, y: 0 },
      { x: 8, y: 1.5 },
      { x: 5, y: 1.5 },
      { x: 5, y: 4 },
      { x: 0, y: 4 },
    ],
  },
]

// ── Multi-room types ───────────────────────────────────────────────────────

/** An obstacle (cutout) inside a room — pillar, wall, island, etc. */
export interface Obstacle {
  id: string
  label: string
  vertices: Point[]
}

export interface RoomData {
  id: string
  name: string
  vertices: Point[]
  obstacles: Obstacle[]
  materialId: string
  pattern: LayoutPattern
  wastePercentage: number
  color: string
}

const ROOM_COLORS = [
  'hsl(210, 80%, 55%)',  // blue
  'hsl(150, 60%, 45%)',  // green
  'hsl(30, 80%, 55%)',   // orange
  'hsl(280, 60%, 55%)',  // purple
  'hsl(350, 70%, 55%)',  // red
  'hsl(180, 60%, 45%)',  // teal
  'hsl(60, 70%, 45%)',   // yellow
]

export function getRoomColor(index: number): string {
  return ROOM_COLORS[index % ROOM_COLORS.length]
}

let _roomIdCounter = 0
export function createRoom(name: string, vertices: Point[], colorIndex: number, obstacles: Obstacle[] = []): RoomData {
  return {
    id: `room-${++_roomIdCounter}-${Date.now()}`,
    name,
    vertices,
    obstacles,
    materialId: '',
    pattern: 'straight-h',
    wastePercentage: 10,
    color: getRoomColor(colorIndex),
  }
}

let _obstacleIdCounter = 0
export function createObstacle(label: string, vertices: Point[]): Obstacle {
  return { id: `obs-${++_obstacleIdCounter}-${Date.now()}`, label, vertices }
}

/** Common obstacle presets — relative to a placement point */
export const OBSTACLE_PRESETS: { label: string; build: (cx: number, cy: number) => Point[] }[] = [
  {
    label: 'Багана (0.3×0.3)',
    build: (cx, cy) => [
      { x: cx - 0.15, y: cy - 0.15 }, { x: cx + 0.15, y: cy - 0.15 },
      { x: cx + 0.15, y: cy + 0.15 }, { x: cx - 0.15, y: cy + 0.15 },
    ],
  },
  {
    label: 'Багана (0.5×0.5)',
    build: (cx, cy) => [
      { x: cx - 0.25, y: cy - 0.25 }, { x: cx + 0.25, y: cy - 0.25 },
      { x: cx + 0.25, y: cy + 0.25 }, { x: cx - 0.25, y: cy + 0.25 },
    ],
  },
  {
    label: 'Дотор хана (2×0.2)',
    build: (cx, cy) => [
      { x: cx - 1, y: cy - 0.1 }, { x: cx + 1, y: cy - 0.1 },
      { x: cx + 1, y: cy + 0.1 }, { x: cx - 1, y: cy + 0.1 },
    ],
  },
  {
    label: 'Гал тогооны арал (1.5×0.8)',
    build: (cx, cy) => [
      { x: cx - 0.75, y: cy - 0.4 }, { x: cx + 0.75, y: cy - 0.4 },
      { x: cx + 0.75, y: cy + 0.4 }, { x: cx - 0.75, y: cy + 0.4 },
    ],
  },
  {
    label: 'L хана',
    build: (cx, cy) => [
      { x: cx, y: cy }, { x: cx + 1.5, y: cy }, { x: cx + 1.5, y: cy + 0.2 },
      { x: cx + 0.2, y: cy + 0.2 }, { x: cx + 0.2, y: cy + 1 }, { x: cx, y: cy + 1 },
    ],
  },
]

/** Multi-room apartment presets */
export const MULTI_ROOM_PRESETS: { label: string; rooms: { name: string; vertices: Point[]; obstacles?: { label: string; vertices: Point[] }[] }[] }[] = [
  {
    label: '1 өрөө байр',
    rooms: [
      { name: 'Зочны өрөө', vertices: [{ x: 0, y: 0 }, { x: 5, y: 0 }, { x: 5, y: 4 }, { x: 0, y: 4 }] },
      { name: 'Унтлагын өрөө', vertices: [{ x: 5.5, y: 0 }, { x: 9, y: 0 }, { x: 9, y: 3.5 }, { x: 5.5, y: 3.5 }] },
      { name: 'Коридор', vertices: [{ x: 0, y: 4.5 }, { x: 9, y: 4.5 }, { x: 9, y: 6 }, { x: 0, y: 6 }] },
    ],
  },
  {
    label: '2 өрөө байр',
    rooms: [
      { name: 'Зочны өрөө', vertices: [{ x: 0, y: 0 }, { x: 5, y: 0 }, { x: 5, y: 4 }, { x: 0, y: 4 }] },
      { name: 'Унтлага 1', vertices: [{ x: 5.5, y: 0 }, { x: 9, y: 0 }, { x: 9, y: 3.5 }, { x: 5.5, y: 3.5 }] },
      { name: 'Унтлага 2', vertices: [{ x: 5.5, y: 4 }, { x: 9, y: 4 }, { x: 9, y: 7 }, { x: 5.5, y: 7 }] },
      { name: 'Коридор', vertices: [{ x: 0, y: 4.5 }, { x: 5, y: 4.5 }, { x: 5, y: 7 }, { x: 0, y: 7 }] },
    ],
  },
  {
    label: 'Студио',
    rooms: [
      {
        name: 'Студио',
        vertices: [
          { x: 0, y: 0 }, { x: 8, y: 0 }, { x: 8, y: 2.5 },
          { x: 5, y: 2.5 }, { x: 5, y: 5 }, { x: 0, y: 5 },
        ],
      },
      { name: 'Угаалгын өрөө', vertices: [{ x: 5.5, y: 3 }, { x: 8, y: 3 }, { x: 8, y: 5 }, { x: 5.5, y: 5 }] },
    ],
  },
  {
    label: 'Оффис',
    rooms: [
      {
        name: 'Нээлттэй талбай',
        vertices: [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 6 }, { x: 0, y: 6 }],
        obstacles: [
          { label: 'Багана', vertices: [{ x: 3, y: 2.75 }, { x: 3.4, y: 2.75 }, { x: 3.4, y: 3.25 }, { x: 3, y: 3.25 }] },
          { label: 'Багана', vertices: [{ x: 6.6, y: 2.75 }, { x: 7, y: 2.75 }, { x: 7, y: 3.25 }, { x: 6.6, y: 3.25 }] },
        ],
      },
      { name: 'Хурлын өрөө', vertices: [{ x: 0, y: 6.5 }, { x: 4.5, y: 6.5 }, { x: 4.5, y: 8 }, { x: 0, y: 8 }] },
      { name: 'Захирлын өрөө', vertices: [{ x: 5, y: 6.5 }, { x: 10, y: 6.5 }, { x: 10, y: 8 }, { x: 5, y: 8 }] },
    ],
  },
  {
    label: 'Багана + хана',
    rooms: [
      {
        name: 'Зочны өрөө',
        vertices: [{ x: 0, y: 0 }, { x: 7, y: 0 }, { x: 7, y: 5 }, { x: 0, y: 5 }],
        obstacles: [
          { label: 'Багана', vertices: [{ x: 3.25, y: 2.25 }, { x: 3.75, y: 2.25 }, { x: 3.75, y: 2.75 }, { x: 3.25, y: 2.75 }] },
          { label: 'Дотор хана', vertices: [{ x: 4.5, y: 0 }, { x: 4.7, y: 0 }, { x: 4.7, y: 2 }, { x: 4.5, y: 2 }] },
          { label: 'Гал тогооны арал', vertices: [{ x: 1, y: 1 }, { x: 2.5, y: 1 }, { x: 2.5, y: 1.8 }, { x: 1, y: 1.8 }] },
        ],
      },
    ],
  },
]

// ── Geometry utilities ─────────────────────────────────────────────────────

/** Shoelace formula: area of a simple polygon. Always positive. */
export function polygonArea(vertices: Point[]): number {
  const n = vertices.length
  if (n < 3) return 0
  let area = 0
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    area += vertices[i].x * vertices[j].y
    area -= vertices[j].x * vertices[i].y
  }
  return Math.abs(area) / 2
}

/** Axis-aligned bounding box of polygon */
export function polygonBounds(vertices: Point[]): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const v of vertices) {
    if (v.x < minX) minX = v.x
    if (v.y < minY) minY = v.y
    if (v.x > maxX) maxX = v.x
    if (v.y > maxY) maxY = v.y
  }
  return { minX, minY, maxX, maxY }
}

/** Ray-casting point-in-polygon test */
export function pointInPolygon(px: number, py: number, vertices: Point[]): boolean {
  const n = vertices.length
  let inside = false
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = vertices[i].x, yi = vertices[i].y
    const xj = vertices[j].x, yj = vertices[j].y
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}

/** Net area of a room = room polygon - obstacle polygons */
export function roomNetArea(vertices: Point[], obstacles: Obstacle[]): number {
  const gross = polygonArea(vertices)
  const obstacleTotal = obstacles.reduce((s, o) => s + polygonArea(o.vertices), 0)
  return Math.max(0, gross - obstacleTotal)
}

/** Test if point is inside room but NOT inside any obstacle */
export function pointInRoom(px: number, py: number, vertices: Point[], obstacles: Obstacle[]): boolean {
  if (!pointInPolygon(px, py, vertices)) return false
  for (const obs of obstacles) {
    if (obs.vertices.length >= 3 && pointInPolygon(px, py, obs.vertices)) return false
  }
  return true
}

/** Test if two line segments (p1-p2) and (p3-p4) intersect */
function segmentsIntersect(
  p1x: number, p1y: number, p2x: number, p2y: number,
  p3x: number, p3y: number, p4x: number, p4y: number
): boolean {
  const d1x = p2x - p1x, d1y = p2y - p1y
  const d2x = p4x - p3x, d2y = p4y - p3y
  const cross = d1x * d2y - d1y * d2x
  if (Math.abs(cross) < 1e-10) return false
  const t = ((p3x - p1x) * d2y - (p3y - p1y) * d2x) / cross
  const u = ((p3x - p1x) * d1y - (p3y - p1y) * d1x) / cross
  return t >= 0 && t <= 1 && u >= 0 && u <= 1
}

/** Check if a rectangle overlaps with polygon.
 *  Tests sample points + polygon edge vs rect edge intersection. */
function rectOverlapsPolygon(
  cx: number,
  cy: number,
  halfW: number,
  halfH: number,
  vertices: Point[]
): boolean {
  // Quick test: sample points inside polygon
  const pts = [
    [cx, cy],
    [cx - halfW, cy - halfH],
    [cx + halfW, cy - halfH],
    [cx + halfW, cy + halfH],
    [cx - halfW, cy + halfH],
    [cx, cy - halfH],
    [cx, cy + halfH],
    [cx - halfW, cy],
    [cx + halfW, cy],
  ]
  for (const [x, y] of pts) {
    if (pointInPolygon(x, y, vertices)) return true
  }

  // Also check: any polygon edge crosses any rect edge
  const rectEdges: [number, number, number, number][] = [
    [cx - halfW, cy - halfH, cx + halfW, cy - halfH], // bottom
    [cx + halfW, cy - halfH, cx + halfW, cy + halfH], // right
    [cx + halfW, cy + halfH, cx - halfW, cy + halfH], // top
    [cx - halfW, cy + halfH, cx - halfW, cy - halfH], // left
  ]
  const n = vertices.length
  for (let i = 0; i < n; i++) {
    const a = vertices[i], b = vertices[(i + 1) % n]
    for (const [ex1, ey1, ex2, ey2] of rectEdges) {
      if (segmentsIntersect(a.x, a.y, b.x, b.y, ex1, ey1, ex2, ey2)) return true
    }
  }

  // Check if a polygon vertex is inside the rect
  for (const v of vertices) {
    if (v.x >= cx - halfW && v.x <= cx + halfW && v.y >= cy - halfH && v.y <= cy + halfH) return true
  }

  return false
}

/** Check if center of plank is inside polygon */
function plankCenterInPolygon(cx: number, cy: number, vertices: Point[]): boolean {
  return pointInPolygon(cx, cy, vertices)
}

/** Check if plank is fully inside polygon (all corners inside) */
function plankFullyInside(
  cx: number,
  cy: number,
  halfW: number,
  halfH: number,
  rotation: number,
  vertices: Point[]
): boolean {
  const cos = Math.cos(rotation)
  const sin = Math.sin(rotation)
  const corners = [
    [-halfW, -halfH],
    [halfW, -halfH],
    [halfW, halfH],
    [-halfW, halfH],
  ]
  for (const [lx, ly] of corners) {
    const wx = cx + lx * cos - ly * sin
    const wy = cy + lx * sin + ly * cos
    if (!pointInPolygon(wx, wy, vertices)) return false
  }
  return true
}

// ── Polygon plank layout generator ─────────────────────────────────────────

export const MAX_POLYGON_DIM = 50

/** Check if plank overlaps any obstacle */
function plankHitsObstacle(
  cx: number, cy: number, halfW: number, halfH: number,
  rotation: number, obstacles: Obstacle[]
): boolean {
  if (obstacles.length === 0) return false
  const cos = Math.cos(rotation)
  const sin = Math.sin(rotation)
  // Test plank center + corners against each obstacle
  const pts = [
    [cx, cy],
    [cx + (-halfW * cos - -halfH * sin), cy + (-halfW * sin + -halfH * cos)],
    [cx + (halfW * cos - -halfH * sin), cy + (halfW * sin + -halfH * cos)],
    [cx + (halfW * cos - halfH * sin), cy + (halfW * sin + halfH * cos)],
    [cx + (-halfW * cos - halfH * sin), cy + (-halfW * sin + halfH * cos)],
  ]
  for (const obs of obstacles) {
    if (obs.vertices.length < 3) continue
    for (const [px, py] of pts) {
      if (pointInPolygon(px, py, obs.vertices)) return true
    }
  }
  return false
}

/** Check if plank is fully inside room AND not touching any obstacle */
function plankFullyInsideRoom(
  cx: number, cy: number, halfW: number, halfH: number,
  rotation: number, vertices: Point[], obstacles: Obstacle[]
): boolean {
  if (!plankFullyInside(cx, cy, halfW, halfH, rotation, vertices)) return false
  if (plankHitsObstacle(cx, cy, halfW, halfH, rotation, obstacles)) return false
  return true
}

/** Generate planks to fill a polygon-shaped room, avoiding obstacles */
export function generatePolygonPlankLayout(
  vertices: Point[],
  m2PerBox: number,
  piecesPerBox: number,
  pattern: LayoutPattern,
  obstacles: Obstacle[] = []
): PlankData[] {
  if (vertices.length < 3) return []
  const bounds = polygonBounds(vertices)
  const { length: plankLen, width: plankW } = getPlankDimensions(m2PerBox / piecesPerBox)
  const planks: PlankData[] = []
  const MAX_PLANKS = 25000
  const shouldStop = () => planks.length >= MAX_PLANKS
  const pad = Math.max(plankLen, plankW) * 2

  const bW = Math.min(bounds.maxX - bounds.minX, MAX_POLYGON_DIM)
  const bH = Math.min(bounds.maxY - bounds.minY, MAX_POLYGON_DIM)
  const ox = bounds.minX
  const oy = bounds.minY

  if (pattern === 'straight-h') {
    let row = 0
    for (let y = oy - plankW; y < oy + bH + pad && !shouldStop(); y += plankW, row++) {
      const offset = (row % 2) * (plankLen / 2)
      for (let x = ox - plankLen; x < ox + bW + pad && !shouldStop(); x += plankLen) {
        const px = x + offset
        const cx = px + plankLen / 2
        const cy = y + plankW / 2

        if (!rectOverlapsPolygon(cx, cy, plankLen / 2, plankW / 2, vertices)) continue
        // Skip planks whose center is inside an obstacle
        if (obstacles.some((o) => o.vertices.length >= 3 && pointInPolygon(cx, cy, o.vertices))) continue

        const fullyInside = plankFullyInsideRoom(cx, cy, plankLen / 2, plankW / 2, 0, vertices, obstacles)
        planks.push({
          x: cx, y: cy, length: plankLen, width: plankW, rotation: 0,
          isCut: !fullyInside, cutSides: {},
          clippedBounds: fullyInside ? undefined : [
            Math.max(bounds.minX, px), Math.max(bounds.minY, y),
            Math.min(bounds.maxX, px + plankLen), Math.min(bounds.maxY, y + plankW),
          ],
        })
      }
    }
  } else if (pattern === 'straight-v') {
    let col = 0
    for (let x = ox - plankW; x < ox + bW + pad && !shouldStop(); x += plankW, col++) {
      const offset = (col % 2) * (plankLen / 2)
      for (let y = oy - plankLen; y < oy + bH + pad && !shouldStop(); y += plankLen) {
        const py = y + offset
        const cx = x + plankW / 2
        const cy = py + plankLen / 2

        if (!rectOverlapsPolygon(cx, cy, plankW / 2, plankLen / 2, vertices)) continue
        if (obstacles.some((o) => o.vertices.length >= 3 && pointInPolygon(cx, cy, o.vertices))) continue

        const fullyInside = plankFullyInsideRoom(cx, cy, plankW / 2, plankLen / 2, 0, vertices, obstacles)
        planks.push({
          x: cx, y: cy, length: plankLen, width: plankW, rotation: Math.PI / 2,
          isCut: !fullyInside, cutSides: {},
          clippedBounds: fullyInside ? undefined : [
            Math.max(bounds.minX, x), Math.max(bounds.minY, py),
            Math.min(bounds.maxX, x + plankW), Math.min(bounds.maxY, py + plankLen),
          ],
        })
      }
    }
  } else if (pattern === 'diagonal') {
    const cos45 = Math.cos(Math.PI / 4)
    const sin45 = Math.sin(Math.PI / 4)
    const ux = plankLen * cos45
    const uy = plankLen * sin45
    const vx = -plankW * sin45
    const vy = plankW * cos45
    const diag = Math.sqrt(bW * bW + bH * bH) + plankLen * 4
    const nU = Math.min(Math.ceil(diag / plankLen) + 12, 250)
    const nV = Math.min(Math.ceil(diag / plankW) + 12, 250)
    const centerX = ox + bW / 2
    const centerY = oy + bH / 2

    for (let i = -nV; i <= nV && !shouldStop(); i++) {
      for (let j = -nU; j <= nU && !shouldStop(); j++) {
        const cx = centerX + j * ux + i * vx
        const cy = centerY + j * uy + i * vy

        if (!rectOverlapsPolygon(cx, cy, plankLen / 2, plankW / 2, vertices)) continue
        if (obstacles.some((o) => o.vertices.length >= 3 && pointInPolygon(cx, cy, o.vertices))) continue

        const fullyInside = plankFullyInsideRoom(cx, cy, plankLen / 2, plankW / 2, Math.PI / 4, vertices, obstacles)
        planks.push({
          x: cx, y: cy, length: plankLen, width: plankW, rotation: Math.PI / 4,
          isCut: !fullyInside, cutSides: {},
        })
      }
    }
  }

  // Deduplicate
  const seen = new Set<string>()
  return planks.filter((p) => {
    const key = `${Math.round(p.x * 10000)}_${Math.round(p.y * 10000)}_${p.rotation.toFixed(4)}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/** Calculate materials needed for a polygon room (subtracting obstacles) */
export function calculatePolygonMaterials(
  vertices: Point[],
  m2PerBox: number,
  piecesPerBox: number,
  pricePerBox: number,
  wastePercent: number,
  pattern: LayoutPattern,
  obstacles: Obstacle[] = []
): { totalArea: number; obstacleArea: number; areaWithWaste: number; tilesNeeded: number; boxesNeeded: number; totalCost: number } {
  const patternWasteBonus: Record<LayoutPattern, number> = {
    'straight-h': 0,
    'straight-v': 0,
    diagonal: 10,
  }
  const grossArea = polygonArea(vertices)
  const obstacleArea = obstacles.reduce((s, o) => s + polygonArea(o.vertices), 0)
  const totalArea = Math.max(0, grossArea - obstacleArea)
  const effectiveWaste = Math.min(50, wastePercent + (patternWasteBonus[pattern] ?? 0))
  const areaWithWaste = totalArea * (1 + effectiveWaste / 100)
  const boxesNeeded = Math.ceil(areaWithWaste / m2PerBox)
  const tilesNeeded = boxesNeeded * piecesPerBox
  const totalCost = boxesNeeded * pricePerBox
  return { totalArea, obstacleArea, areaWithWaste, tilesNeeded, boxesNeeded, totalCost }
}
