import { useRef, useEffect, useState, useMemo } from 'react'
import type { LayoutPattern } from '@/lib/plannerCalculations'
import { generatePlankLayout, type PlankData } from '@/lib/plannerCalculations'

interface FloorPreviewProps {
  width: number
  height: number
  pattern?: LayoutPattern
  m2PerBox?: number
  piecesPerBox?: number
  materialColor1?: string
  materialColor2?: string
  borderColor?: string
  cutColor?: string
  className?: string
}

/** Convert room coords (meters) to SVG pixel coords. Y flipped for SVG. */
const GAP_PX = 1.5

function plankToSvg(
  p: PlankData,
  scale: number,
  padding: number,
  _roomW: number,
  roomH: number
) {
  const pxPerM = 50 * scale
  const cx = padding + p.x * pxPerM
  const cy = padding + (roomH - p.y) * pxPerM
  const w = Math.max(2, p.length * pxPerM - GAP_PX)
  const h = Math.max(2, p.width * pxPerM - GAP_PX)
  const rot = -p.rotation * (180 / Math.PI)
  return { cx, cy, w, h, rot }
}

/** Room rect (x, y, w, h) to SVG rect - y is bottom in room coords */
function roomRectToSvg(
  rx: number,
  ry: number,
  rw: number,
  rh: number,
  padding: number,
  roomH: number,
  pxPerM: number
) {
  const svgX = padding + rx * pxPerM
  const svgY = padding + (roomH - (ry + rh)) * pxPerM
  const svgW = Math.max(1, rw * pxPerM - GAP_PX)
  const svgH = Math.max(1, rh * pxPerM - GAP_PX)
  return { x: svgX, y: svgY, w: svgW, h: svgH }
}

/** Get waste rects in room coords for straight-h or straight-v cut planks */
function getWasteRects(
  p: PlankData,
  roomW: number,
  roomH: number
): Array<{ x: number; y: number; w: number; h: number }> {
  const rects: Array<{ x: number; y: number; w: number; h: number }> = []
  const hL = p.length / 2
  const hW = p.width / 2

  const hasStraightCutSides =
    p.cutSides && (p.cutSides.left || p.cutSides.right || p.cutSides.top || p.cutSides.bottom)
  if (!hasStraightCutSides) return rects

  const isVertical = Math.abs(p.rotation - Math.PI / 2) < 0.01
  if (isVertical) {
    if (p.cutSides!.left) {
      const overlap = Math.max(0, hW - p.x)
      if (overlap > 0.001)
        rects.push({ x: p.x - hW, y: p.y - hL, w: overlap, h: p.length })
    }
    if (p.cutSides!.right) {
      const overlap = Math.max(0, p.x + hW - roomW)
      if (overlap > 0.001)
        rects.push({ x: roomW, y: p.y - hL, w: overlap, h: p.length })
    }
    if (p.cutSides!.bottom) {
      const overlap = Math.max(0, hL - p.y)
      if (overlap > 0.001)
        rects.push({ x: p.x - hW, y: p.y - hL, w: p.width, h: overlap })
    }
    if (p.cutSides!.top) {
      const overlap = Math.max(0, p.y + hL - roomH)
      if (overlap > 0.001)
        rects.push({ x: p.x - hW, y: roomH, w: p.width, h: overlap })
    }
  } else {
    if (p.cutSides!.left) {
      const overlap = Math.max(0, hL - p.x)
      if (overlap > 0.001)
        rects.push({ x: p.x - hL, y: p.y - hW, w: overlap, h: p.width })
    }
    if (p.cutSides!.right) {
      const overlap = Math.max(0, p.x + hL - roomW)
      if (overlap > 0.001)
        rects.push({ x: roomW, y: p.y - hW, w: overlap, h: p.width })
    }
    if (p.cutSides!.bottom) {
      const overlap = Math.max(0, hW - p.y)
      if (overlap > 0.001)
        rects.push({ x: p.x - hL, y: p.y - hW, w: p.length, h: overlap })
    }
    if (p.cutSides!.top) {
      const overlap = Math.max(0, p.y + hW - roomH)
      if (overlap > 0.001)
        rects.push({ x: p.x - hL, y: roomH, w: p.length, h: overlap })
    }
  }
  return rects
}

export function FloorPreview({
  width: roomW,
  height: roomH,
  pattern = 'straight-h',
  m2PerBox = 2.4,
  piecesPerBox = 12,
  materialColor1 = 'hsl(var(--muted))',
  materialColor2 = 'hsl(var(--muted-foreground) / 0.2)',
  borderColor = 'hsl(var(--border))',
  cutColor = '#c44242',
  className,
}: FloorPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    if (!containerRef.current || roomW <= 0 || roomH <= 0) return
    const el = containerRef.current
    const updateScale = () => {
      const w = el.clientWidth
      const h = el.clientHeight
      if (w <= 0 || h <= 0) return
      const extra = 120
      const scaleX = (w - 24) / (roomW * 50 + extra * 2)
      const scaleY = (h - 24) / (roomH * 50 + extra * 2)
      setScale(Math.min(scaleX, scaleY, 2) * 0.9)
    }
    updateScale()
    const observer = new ResizeObserver(updateScale)
    observer.observe(el)
    return () => observer.disconnect()
  }, [roomW, roomH])

  const planks = useMemo(
    () =>
      generatePlankLayout(roomW, roomH, m2PerBox, piecesPerBox, pattern),
    [roomW, roomH, m2PerBox, piecesPerBox, pattern]
  )

  const padding = 40
  const pxPerM = 50 * scale
  const viewW = roomW * pxPerM
  const viewH = roomH * pxPerM
  const contentMargin = 80
  const svgMinX = -contentMargin
  const svgMinY = -contentMargin
  const svgW = viewW + padding * 2 + contentMargin * 2
  const svgH = viewH + padding * 2 + contentMargin * 2

  return (
    <div
      ref={containerRef}
      className={`min-h-0 flex-1 overflow-hidden rounded-lg border ${className ?? ''}`}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`${svgMinX} ${svgMinY} ${svgW} ${svgH}`}
        preserveAspectRatio="xMidYMid meet"
        className="block h-full w-full"
        style={{ minHeight: 0 }}
      >
        <defs>
          <clipPath id="room-clip">
            <rect x={padding} y={padding} width={viewW} height={viewH} />
          </clipPath>
          {/* Margin so cut planks at edges show red stroke/diagonal fully - ~1 plank length */}
          <clipPath id="room-clip-margin">
            <rect
              x={padding - contentMargin}
              y={padding - contentMargin}
              width={viewW + contentMargin * 2}
              height={viewH + contentMargin * 2}
            />
          </clipPath>
        </defs>
        <rect
          x={padding}
          y={padding}
          width={viewW}
          height={viewH}
          fill="hsl(var(--background))"
          stroke={borderColor}
          strokeWidth={3}
        />
        <g clipPath="url(#room-clip-margin)">
        {planks.map((p, i) => {
          const fill = i % 2 === 0 ? materialColor1 : materialColor2
          const hasStraightCutSides =
            p.cutSides && (p.cutSides.left || p.cutSides.right || p.cutSides.top || p.cutSides.bottom)

          if (p.isCut && hasStraightCutSides) {
            return (
              <g key={i}>
                {p.clippedBounds && p.clippedBounds[2] - p.clippedBounds[0] > 0.01 && p.clippedBounds[3] - p.clippedBounds[1] > 0.01 && (() => {
                  const r = roomRectToSvg(
                    p.clippedBounds![0],
                    p.clippedBounds![1],
                    p.clippedBounds![2] - p.clippedBounds![0],
                    p.clippedBounds![3] - p.clippedBounds![1],
                    padding,
                    roomH,
                    pxPerM
                  )
                  return (
                    <rect
                      x={r.x}
                      y={r.y}
                      width={r.w}
                      height={r.h}
                      fill={fill}
                      stroke={borderColor}
                      strokeWidth={1}
                    />
                  )
                })()}
                {getWasteRects(p, roomW, roomH).map((wr, j) => {
                  const r = roomRectToSvg(wr.x, wr.y, wr.w, wr.h, padding, roomH, pxPerM)
                  return (
                    <g key={`${i}-waste-${j}`}>
                      <rect
                        x={r.x}
                        y={r.y}
                        width={r.w}
                        height={r.h}
                        fill={cutColor}
                        stroke={cutColor}
                        strokeWidth={1}
                        strokeDasharray="3 2"
                      />
                      <line
                        x1={r.x}
                        y1={r.y + r.h}
                        x2={r.x + r.w}
                        y2={r.y}
                        stroke={cutColor}
                        strokeWidth={1}
                        opacity={0.8}
                      />
                    </g>
                  )
                })}
              </g>
            )
          }

          const { cx, cy, w, h, rot } = plankToSvg(p, scale, padding, roomW, roomH)
          return (
            <g key={i} transform={`translate(${cx},${cy}) rotate(${rot}) translate(${-w / 2},${-h / 2})`}>
              <rect
                x={0}
                y={0}
                width={w}
                height={h}
                fill={fill}
                stroke={p.isCut ? cutColor : borderColor}
                strokeWidth={p.isCut ? 1.5 : 1}
                strokeDasharray={p.isCut ? '3 2' : undefined}
              />
              {p.isCut && (
                <line
                  x1={0}
                  y1={h}
                  x2={w}
                  y2={0}
                  stroke={cutColor}
                  strokeWidth={1}
                  opacity={0.7}
                />
              )}
            </g>
          )
        })}
        </g>
        <text
          x={padding + viewW / 2}
          y={padding - 8}
          textAnchor="middle"
          style={{ font: '14px var(--font-sans)', fill: 'hsl(var(--foreground))' }}
        >
          {roomW}m
        </text>
        <text
          x={padding - 10}
          y={padding + viewH / 2}
          textAnchor="middle"
          transform={`rotate(-90, ${padding - 10}, ${padding + viewH / 2})`}
          style={{ font: '14px var(--font-sans)', fill: 'hsl(var(--foreground))' }}
        >
          {roomH}m
        </text>
      </svg>
    </div>
  )
}
