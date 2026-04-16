/**
 * 2D SVG floor preview for multi-room polygon layouts.
 * Renders planks clipped to each room polygon boundary.
 * Cut planks shown with dashed red outline, full planks with wood colors.
 */

import { useRef, useEffect, useState, useMemo } from 'react'
import type { LayoutPattern, PlankData } from '@/lib/plannerCalculations'
import type { Point, RoomData } from '@/lib/polygonRoom'
import { generatePolygonPlankLayout, polygonBounds, polygonArea } from '@/lib/polygonRoom'

interface FloorPreviewPolygonProps {
  rooms: RoomData[]
  m2PerBox?: number
  piecesPerBox?: number
  className?: string
}

const GAP_PX = 1.5

/** Two alternating wood tones */
const WOOD_COLOR_1 = '#c4a67a'
const WOOD_COLOR_2 = '#b08d5e'
const CUT_STROKE = '#c44242'
const BORDER_COLOR = 'hsl(var(--border))'

export function FloorPreviewPolygon({
  rooms,
  m2PerBox = 2.4,
  piecesPerBox = 12,
  className,
}: FloorPreviewPolygonProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  // Combined bounds of all rooms
  const allBounds = useMemo(() => {
    const allVerts = rooms.flatMap((r) => r.vertices)
    if (allVerts.length === 0) return { minX: 0, minY: 0, maxX: 10, maxY: 8 }
    return polygonBounds(allVerts)
  }, [rooms])

  const totalW = allBounds.maxX - allBounds.minX
  const totalH = allBounds.maxY - allBounds.minY

  useEffect(() => {
    if (!containerRef.current || totalW <= 0 || totalH <= 0) return
    const el = containerRef.current
    const updateScale = () => {
      const w = el.clientWidth
      const h = el.clientHeight
      if (w <= 0 || h <= 0) return
      const extra = 80
      const scaleX = (w - 24) / (totalW * 50 + extra * 2)
      const scaleY = (h - 24) / (totalH * 50 + extra * 2)
      setScale(Math.min(scaleX, scaleY, 2) * 0.9)
    }
    updateScale()
    const observer = new ResizeObserver(updateScale)
    observer.observe(el)
    return () => observer.disconnect()
  }, [totalW, totalH])

  // Generate planks per room (with obstacle avoidance)
  const roomPlanks = useMemo(() => {
    return rooms.map((room) => ({
      room,
      planks: room.vertices.length >= 3
        ? generatePolygonPlankLayout(room.vertices, m2PerBox, piecesPerBox, room.pattern, room.obstacles ?? [])
        : [],
    }))
  }, [rooms, m2PerBox, piecesPerBox])

  const hasRooms = rooms.some((r) => r.vertices.length >= 3)
  if (!hasRooms) {
    return (
      <div className={`flex min-h-[400px] items-center justify-center rounded-lg border ${className ?? ''}`}>
        <p className="text-sm text-muted-foreground">Өрөөний хэлбэрийг зурна уу (3+ цэг)</p>
      </div>
    )
  }

  const padding = 40
  const pxPerM = 50 * scale
  const toSvgX = (mx: number) => padding + (mx - allBounds.minX) * pxPerM
  const toSvgY = (my: number) => padding + (allBounds.maxY - my) * pxPerM
  const viewW = totalW * pxPerM
  const viewH = totalH * pxPerM
  const margin = 60
  const svgW = viewW + padding * 2 + margin * 2
  const svgH = viewH + padding * 2 + margin * 2

  return (
    <div ref={containerRef}
      className={`min-h-0 flex-1 overflow-hidden rounded-lg border ${className ?? ''}`}>
      <svg width="100%" height="100%"
        viewBox={`${-margin} ${-margin} ${svgW} ${svgH}`}
        preserveAspectRatio="xMidYMid meet"
        className="block h-full w-full" style={{ minHeight: 0 }}>
        <defs>
          {roomPlanks.map(({ room }) => {
            const pts = room.vertices.map((v) => `${toSvgX(v.x)},${toSvgY(v.y)}`).join(' ')
            return (
              <clipPath key={`clip-${room.id}`} id={`poly-clip-${room.id}`}>
                <polygon points={pts} />
              </clipPath>
            )
          })}
        </defs>

        {roomPlanks.map(({ room, planks }) => {
          if (room.vertices.length < 3) return null
          const pts = room.vertices.map((v) => `${toSvgX(v.x)},${toSvgY(v.y)}`).join(' ')

          // Room centroid for label
          const cx = room.vertices.reduce((s, v) => s + v.x, 0) / room.vertices.length
          const cy = room.vertices.reduce((s, v) => s + v.y, 0) / room.vertices.length
          const area = polygonArea(room.vertices)

          return (
            <g key={room.id}>
              {/* Room background */}
              <polygon points={pts} fill="hsl(var(--background))" stroke={BORDER_COLOR}
                strokeWidth={3} strokeLinejoin="round" />

              {/* Planks clipped to this room */}
              <g clipPath={`url(#poly-clip-${room.id})`}>
                {planks.map((p, i) => {
                  const fill = i % 2 === 0 ? WOOD_COLOR_1 : WOOD_COLOR_2
                  const svgCx = toSvgX(p.x)
                  const svgCy = toSvgY(p.y)
                  const w = Math.max(2, p.length * pxPerM - GAP_PX)
                  const h = Math.max(2, p.width * pxPerM - GAP_PX)
                  const rot = -p.rotation * (180 / Math.PI)

                  return (
                    <g key={i} transform={`translate(${svgCx},${svgCy}) rotate(${rot}) translate(${-w / 2},${-h / 2})`}>
                      <rect x={0} y={0} width={w} height={h}
                        fill={fill}
                        stroke={p.isCut ? CUT_STROKE : '#8b7355'}
                        strokeWidth={p.isCut ? 1.2 : 0.4}
                        strokeDasharray={p.isCut ? '3 2' : undefined}
                      />
                      {p.isCut && (
                        <line x1={0} y1={h} x2={w} y2={0}
                          stroke={CUT_STROKE} strokeWidth={0.6} opacity={0.4} />
                      )}
                    </g>
                  )
                })}
              </g>

              {/* Room border on top */}
              <polygon points={pts} fill="none" stroke={room.color}
                strokeWidth={2.5} strokeLinejoin="round" />

              {/* Obstacles */}
              {(room.obstacles ?? []).map((obs) => {
                if (obs.vertices.length < 3) return null
                const obsPts = obs.vertices.map((v) => `${toSvgX(v.x)},${toSvgY(v.y)}`).join(' ')
                const ocx = obs.vertices.reduce((s, v) => s + v.x, 0) / obs.vertices.length
                const ocy = obs.vertices.reduce((s, v) => s + v.y, 0) / obs.vertices.length
                return (
                  <g key={obs.id}>
                    <polygon points={obsPts}
                      fill="hsl(var(--background))"
                      stroke="#888" strokeWidth={1.5} strokeDasharray="4 2" />
                    <text x={toSvgX(ocx)} y={toSvgY(ocy) + 3} textAnchor="middle"
                      style={{ font: '9px var(--font-sans)', fill: '#888' }}>
                      {obs.label}
                    </text>
                  </g>
                )
              })}

              {/* Room label */}
              <text x={toSvgX(cx)} y={toSvgY(cy)}
                textAnchor="middle"
                style={{ font: 'bold 12px var(--font-sans)', fill: room.color }}>
                {room.name}
              </text>
              <text x={toSvgX(cx)} y={toSvgY(cy) + 14}
                textAnchor="middle"
                style={{ font: '10px var(--font-sans)', fill: 'hsl(var(--muted-foreground))' }}>
                {area.toFixed(1)} m²
              </text>

              {/* Edge lengths */}
              {room.vertices.map((v, i) => {
                const next = room.vertices[(i + 1) % room.vertices.length]
                const len = Math.hypot(next.x - v.x, next.y - v.y)
                const mx = (toSvgX(v.x) + toSvgX(next.x)) / 2
                const my = (toSvgY(v.y) + toSvgY(next.y)) / 2
                return (
                  <text key={`el-${i}`} x={mx} y={my - 5} textAnchor="middle"
                    style={{ font: '10px var(--font-sans)', fill: 'hsl(var(--foreground))' }}>
                    {len.toFixed(1)}m
                  </text>
                )
              })}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
