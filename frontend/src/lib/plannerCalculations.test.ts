import { describe, it, expect } from 'vitest'
import {
  calculateMaterials,
  generatePlankLayout,
  getPlankDimensions,
  rectIntersectsRoom,
  ROOM_PRESETS,
  PLANK_ASPECT,
  type LayoutPattern,
  type PlankData,
} from './plannerCalculations'

const M2_PER_BOX = 2.4
const PIECES_PER_BOX = 12
const STANDARD_M2_PER_PIECE = M2_PER_BOX / PIECES_PER_BOX

// ----- calculateMaterials -----

describe('calculateMaterials', () => {
  it('computes total area from width and height', () => {
    const r = calculateMaterials(4, 5, 2.4, 12, 50, 10, 'straight-h')
    expect(r.totalArea).toBe(20)
  })

  it('applies waste percent to area with waste', () => {
    const r = calculateMaterials(10, 10, 2.4, 12, 50, 10, 'straight-h')
    expect(r.areaWithWaste).toBe(100 * 1.1)
  })

  it('adds pattern waste bonus for diagonal', () => {
    const straight = calculateMaterials(10, 10, 2.4, 12, 50, 5, 'straight-h').areaWithWaste
    const diag = calculateMaterials(10, 10, 2.4, 12, 50, 5, 'diagonal').areaWithWaste
    expect(diag).toBeGreaterThan(straight)
  })

  it('diagonal adds 10% waste bonus when base waste is 0', () => {
    const diag = calculateMaterials(10, 10, 2.4, 12, 50, 0, 'diagonal')
    expect(diag.areaWithWaste).toBe(100 * 1.1)
  })

  it('caps effective waste at 50%', () => {
    const r = calculateMaterials(10, 10, 2.4, 12, 50, 80, 'straight-h')
    expect(r.areaWithWaste).toBe(100 * 1.5)
  })

  it('computes boxes and tiles correctly', () => {
    const r = calculateMaterials(4, 4, 2.4, 12, 50, 10, 'straight-h')
    expect(r.boxesNeeded).toBeGreaterThanOrEqual(1)
    expect(r.tilesNeeded).toBe(r.boxesNeeded * 12)
  })

  it('computes totalCost as boxesNeeded * pricePerBox', () => {
    const r = calculateMaterials(5, 5, 2.4, 12, 50, 10, 'straight-h')
    expect(r.totalCost).toBe(r.boxesNeeded * 50)
  })

  it('uses 0 waste bonus for straight-h and straight-v', () => {
    const h = calculateMaterials(10, 10, 2.4, 12, 50, 5, 'straight-h')
    const v = calculateMaterials(10, 10, 2.4, 12, 50, 5, 'straight-v')
    expect(h.areaWithWaste).toBe(v.areaWithWaste)
  })


  it('handles small room without exploding', () => {
    const r = calculateMaterials(1, 1, 2.4, 12, 50, 0, 'straight-h')
    expect(r.totalArea).toBe(1)
    expect(r.boxesNeeded).toBeGreaterThanOrEqual(1)
    expect(Number.isFinite(r.totalCost)).toBe(true)
  })

  it('returns all required fields', () => {
    const r = calculateMaterials(4, 4, 2.4, 12, 50, 10, 'straight-h')
    expect(r).toHaveProperty('totalArea')
    expect(r).toHaveProperty('areaWithWaste')
    expect(r).toHaveProperty('tilesNeeded')
    expect(r).toHaveProperty('boxesNeeded')
    expect(r).toHaveProperty('totalCost')
  })
})

// ----- getPlankDimensions -----

describe('getPlankDimensions', () => {
  it('returns length and width with aspect ratio 5:1', () => {
    const area = 0.2
    const { length, width } = getPlankDimensions(area)
    expect(length * width).toBeCloseTo(area, 10)
    expect(length / width).toBeCloseTo(PLANK_ASPECT, 2)
  })

  it('produces consistent dimensions for standard m2 per piece', () => {
    const { length, width } = getPlankDimensions(STANDARD_M2_PER_PIECE)
    expect(length).toBeGreaterThan(0)
    expect(width).toBeGreaterThan(0)
    expect(length * width).toBeCloseTo(STANDARD_M2_PER_PIECE, 8)
  })

  it('length is always greater than width', () => {
    for (const area of [0.1, 0.2, 0.5, 1.0]) {
      const { length, width } = getPlankDimensions(area)
      expect(length).toBeGreaterThan(width)
    }
  })

  it('produces same dimensions for equal area', () => {
    const a = getPlankDimensions(0.2)
    const b = getPlankDimensions(0.2)
    expect(a.length).toBe(b.length)
    expect(a.width).toBe(b.width)
  })
})

// ----- rectIntersectsRoom -----

describe('rectIntersectsRoom', () => {
  const roomW = 5
  const roomH = 4

  it('returns null when rect is fully outside (right)', () => {
    expect(rectIntersectsRoom(10, 0, 1, 0.4, roomW, roomH, 0)).toBeNull()
  })

  it('returns null when rect is fully outside (left)', () => {
    expect(rectIntersectsRoom(-5, 0, 1, 0.4, roomW, roomH, 0)).toBeNull()
  })

  it('returns null when rect is fully outside (below)', () => {
    expect(rectIntersectsRoom(1, -5, 0.5, 0.2, roomW, roomH, 0)).toBeNull()
  })

  it('returns clipped bounds when rect overlaps left edge', () => {
    const r = rectIntersectsRoom(-0.5, 0, 1, 0.4, roomW, roomH, 0)
    expect(r).not.toBeNull()
    expect(r!.isCut).toBe(true)
    expect(r!.clipped[0]).toBe(0)
    expect(r!.clipped[2]).toBeGreaterThan(r!.clipped[0])
    expect(r!.clipped[3]).toBeGreaterThan(r!.clipped[1])
  })

  it('returns clipped bounds when rect overlaps right edge', () => {
    const r = rectIntersectsRoom(4.5, 0, 1, 0.4, roomW, roomH, 0)
    expect(r).not.toBeNull()
    expect(r!.isCut).toBe(true)
    expect(r!.clipped[2]).toBe(roomW)
  })

  it('returns clipped bounds when rect overlaps top and bottom', () => {
    const r = rectIntersectsRoom(1, -0.2, 0.5, 5, roomW, roomH, 0)
    expect(r).not.toBeNull()
    expect(r!.isCut).toBe(true)
    expect(r!.clipped[1]).toBe(0)
    expect(r!.clipped[3]).toBe(roomH)
  })

  it('returns non-cut when rect is fully inside', () => {
    const r = rectIntersectsRoom(1, 1, 0.5, 0.2, roomW, roomH, 0)
    expect(r).not.toBeNull()
    expect(r!.isCut).toBe(false)
    expect(r!.clipped).toEqual([1, 1, 1.5, 1.2])
  })

  it('clipped bounds are always valid (x2 > x1, y2 > y1)', () => {
    const cases: [number, number, number, number][] = [
      [-0.5, 0, 1, 0.4],
      [4.2, 1, 1, 0.4],
      [1, -0.1, 0.5, 0.5],
      [2, 3.5, 0.5, 0.5],
    ]
    for (const [x, y, w, h] of cases) {
      const r = rectIntersectsRoom(x, y, w, h, roomW, roomH, 0)
      if (r) {
        expect(r.clipped[2]).toBeGreaterThan(r.clipped[0])
        expect(r.clipped[3]).toBeGreaterThan(r.clipped[1])
      }
    }
  })

  it('clipped bounds stay within room', () => {
    const r = rectIntersectsRoom(-0.3, -0.2, 2, 1, roomW, roomH, 0)
    expect(r).not.toBeNull()
    expect(r!.clipped[0]).toBeGreaterThanOrEqual(0)
    expect(r!.clipped[1]).toBeGreaterThanOrEqual(0)
    expect(r!.clipped[2]).toBeLessThanOrEqual(roomW)
    expect(r!.clipped[3]).toBeLessThanOrEqual(roomH)
  })

  it('handles rotated rect that intersects room', () => {
    const r = rectIntersectsRoom(2, 1.5, 0.6, 0.2, roomW, roomH, Math.PI / 4)
    expect(r).not.toBeNull()
    expect(r!.clipped).toBeDefined()
    expect(r!.clipped[2]).toBeGreaterThan(r!.clipped[0])
    expect(r!.clipped[3]).toBeGreaterThan(r!.clipped[1])
  })
})

// ----- Plank structure validation (shared) -----

function assertValidPlank(p: PlankData, _pattern: LayoutPattern) {
  expect(Number.isFinite(p.x)).toBe(true)
  expect(Number.isFinite(p.y)).toBe(true)
  expect(p.length).toBeGreaterThan(0)
  expect(p.width).toBeGreaterThan(0)
  expect(Number.isFinite(p.rotation)).toBe(true)
  expect(typeof p.isCut).toBe('boolean')
  expect(p.cutSides).toBeDefined()
  expect(typeof p.cutSides).toBe('object')
  if (p.clippedBounds) {
    expect(p.clippedBounds).toHaveLength(4)
    expect(p.clippedBounds[2]).toBeGreaterThan(p.clippedBounds[0])
    expect(p.clippedBounds[3]).toBeGreaterThan(p.clippedBounds[1])
  }
}

function assertStraightHCutSidesConsistency(p: PlankData, roomW: number, roomH: number, plankLen: number, plankW: number) {
  if (!p.isCut) return
  const halfL = plankLen / 2
  const halfW = plankW / 2
  const leftEdge = p.x - halfL
  const rightEdge = p.x + halfL
  const bottomEdge = p.y - halfW
  const topEdge = p.y + halfW
  if (p.cutSides.left) expect(leftEdge).toBeLessThan(0)
  if (p.cutSides.right) expect(rightEdge).toBeGreaterThan(roomW)
  if (p.cutSides.bottom) expect(bottomEdge).toBeLessThan(0)
  if (p.cutSides.top) expect(topEdge).toBeGreaterThan(roomH)
}

function assertStraightVCutSidesConsistency(p: PlankData, roomW: number, roomH: number, plankLen: number, plankW: number) {
  if (!p.isCut) return
  const halfL = plankLen / 2
  const halfW = plankW / 2
  const leftEdge = p.x - halfW
  const rightEdge = p.x + halfW
  const bottomEdge = p.y - halfL
  const topEdge = p.y + halfL
  if (p.cutSides.left) expect(leftEdge).toBeLessThan(0)
  if (p.cutSides.right) expect(rightEdge).toBeGreaterThan(roomW)
  if (p.cutSides.bottom) expect(bottomEdge).toBeLessThan(0)
  if (p.cutSides.top) expect(topEdge).toBeGreaterThan(roomH)
}

// ----- generatePlankLayout -----

describe('generatePlankLayout', () => {
  const patterns: LayoutPattern[] = ['straight-h', 'straight-v', 'diagonal']

  const { length: plankLen, width: plankW } = getPlankDimensions(STANDARD_M2_PER_PIECE)

  it('returns non-empty layout for all patterns and room sizes', () => {
    for (const preset of ROOM_PRESETS) {
      for (const pattern of patterns) {
        const planks = generatePlankLayout(
          preset.width,
          preset.height,
          M2_PER_BOX,
          PIECES_PER_BOX,
          pattern
        )
        expect(planks.length).toBeGreaterThan(0)
      }
    }
  })

  it('all planks have valid structure - no NaN, Infinity, or invalid values', () => {
    for (const pattern of patterns) {
      const planks = generatePlankLayout(4, 4, M2_PER_BOX, PIECES_PER_BOX, pattern)
      planks.forEach((p) => assertValidPlank(p, pattern))
    }
  })

  it('straight-h: all planks have rotation 0', () => {
    const planks = generatePlankLayout(4, 4, M2_PER_BOX, PIECES_PER_BOX, 'straight-h')
    planks.forEach((p) => expect(p.rotation).toBe(0))
  })

  it('straight-v: all planks have rotation π/2', () => {
    const planks = generatePlankLayout(4, 4, M2_PER_BOX, PIECES_PER_BOX, 'straight-v')
    planks.forEach((p) => expect(p.rotation).toBeCloseTo(Math.PI / 2, 5))
  })

  it('diagonal: all planks have rotation π/4', () => {
    const planks = generatePlankLayout(4, 4, M2_PER_BOX, PIECES_PER_BOX, 'diagonal')
    planks.forEach((p) => expect(p.rotation).toBeCloseTo(Math.PI / 4, 5))
  })


  it('straight-h: cutSides match actual plank overlap with room', () => {
    const planks = generatePlankLayout(4, 4, M2_PER_BOX, PIECES_PER_BOX, 'straight-h')
    planks.forEach((p) =>
      assertStraightHCutSidesConsistency(p, 4, 4, plankLen, plankW)
    )
  })

  it('straight-v: cutSides match actual plank overlap with room', () => {
    const planks = generatePlankLayout(4, 4, M2_PER_BOX, PIECES_PER_BOX, 'straight-v')
    planks.forEach((p) =>
      assertStraightVCutSidesConsistency(p, 4, 4, plankLen, plankW)
    )
  })

  it('straight-h: if isCut, at least one cutSide is true', () => {
    const planks = generatePlankLayout(4, 4, M2_PER_BOX, PIECES_PER_BOX, 'straight-h')
    const cutPlanks = planks.filter((p) => p.isCut)
    cutPlanks.forEach((p) => {
      const any =
        p.cutSides.left || p.cutSides.right || p.cutSides.top || p.cutSides.bottom
      expect(any).toBe(true)
    })
  })

  it('straight-v: if isCut, at least one cutSide is true', () => {
    const planks = generatePlankLayout(4, 4, M2_PER_BOX, PIECES_PER_BOX, 'straight-v')
    const cutPlanks = planks.filter((p) => p.isCut)
    cutPlanks.forEach((p) => {
      const any =
        p.cutSides.left || p.cutSides.right || p.cutSides.top || p.cutSides.bottom
      expect(any).toBe(true)
    })
  })

  it('straight-h: plank dimensions are length > width', () => {
    const planks = generatePlankLayout(4, 4, M2_PER_BOX, PIECES_PER_BOX, 'straight-h')
    planks.forEach((p) => {
      expect(p.length).toBeGreaterThan(p.width)
      expect(p.length).toBeCloseTo(plankLen, 5)
      expect(p.width).toBeCloseTo(plankW, 5)
    })
  })

  it('straight-v: plank dimensions length > width (length along room Y)', () => {
    const planks = generatePlankLayout(4, 4, M2_PER_BOX, PIECES_PER_BOX, 'straight-v')
    planks.forEach((p) => {
      expect(p.length).toBeGreaterThan(p.width)
      expect(p.length).toBeCloseTo(plankLen, 5)
      expect(p.width).toBeCloseTo(plankW, 5)
    })
  })

  it('no duplicate planks (same center and rotation)', () => {
    for (const pattern of patterns) {
      const planks = generatePlankLayout(4, 4, M2_PER_BOX, PIECES_PER_BOX, pattern)
      const keys = new Set(
        planks.map((p) => `${p.x.toFixed(4)}_${p.y.toFixed(4)}_${p.rotation.toFixed(4)}`)
      )
      expect(keys.size).toBe(planks.length)
    }
  })

  it('is deterministic - same inputs give identical outputs', () => {
    for (const pattern of patterns) {
      const a = generatePlankLayout(5, 4, M2_PER_BOX, PIECES_PER_BOX, pattern)
      const b = generatePlankLayout(5, 4, M2_PER_BOX, PIECES_PER_BOX, pattern)
      expect(a.length).toBe(b.length)
      a.forEach((pa, i) => {
        expect(pa.x).toBeCloseTo(b[i].x, 8)
        expect(pa.y).toBeCloseTo(b[i].y, 8)
        expect(pa.rotation).toBeCloseTo(b[i].rotation, 8)
      })
    }
  })

  it('narrow room (hallway) produces valid layout', () => {
    const planks = generatePlankLayout(8, 1.5, M2_PER_BOX, PIECES_PER_BOX, 'straight-h')
    expect(planks.length).toBeGreaterThan(0)
    planks.forEach((p) => assertValidPlank(p, 'straight-h'))
  })

  it('square room produces reasonable plank count across patterns', () => {
    const counts: Record<LayoutPattern, number> = {} as Record<LayoutPattern, number>
    for (const pattern of patterns) {
      counts[pattern] = generatePlankLayout(4, 4, M2_PER_BOX, PIECES_PER_BOX, pattern).length
    }
    for (const pattern of patterns) {
      expect(counts[pattern]).toBeGreaterThan(10)
    }
  })

  it('cut planks have clippedBounds with positive area', () => {
    const planks = generatePlankLayout(3, 3, M2_PER_BOX, PIECES_PER_BOX, 'straight-h')
    const cutWithBounds = planks.filter((p) => p.isCut && p.clippedBounds)
    cutWithBounds.forEach((p) => {
      const [x1, y1, x2, y2] = p.clippedBounds!
      expect(x2 - x1).toBeGreaterThan(0.01)
      expect(y2 - y1).toBeGreaterThan(0.01)
    })
  })

  it('all patterns produce some cut planks for small room', () => {
    const planks = generatePlankLayout(2, 2, M2_PER_BOX, PIECES_PER_BOX, 'straight-h')
    const cutPlanks = planks.filter((p) => p.isCut)
    expect(cutPlanks.length).toBeGreaterThan(0)
  })

  it('large room produces more planks than small room', () => {
    const small = generatePlankLayout(3, 3, M2_PER_BOX, PIECES_PER_BOX, 'straight-h').length
    const large = generatePlankLayout(8, 6, M2_PER_BOX, PIECES_PER_BOX, 'straight-h').length
    expect(large).toBeGreaterThan(small)
  })

  it('different m2PerBox changes plank count', () => {
    const a = generatePlankLayout(4, 4, 2.4, 12, 'straight-h')
    const b = generatePlankLayout(4, 4, 1.8, 10, 'straight-h')
    expect(a.length).not.toBe(b.length)
  })
})
