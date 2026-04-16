/**
 * Interactive polygon room editor with multi-room support.
 * - Click on canvas to add vertices to active room
 * - Drag vertices to move them
 * - Double-click vertex to delete it
 * - Shows all rooms, active room is editable, others are dimmed
 * - Snaps to 0.5m grid
 */

import { useRef, useState, useCallback } from 'react'
import type { Point, RoomData } from '@/lib/polygonRoom'
import { polygonArea } from '@/lib/polygonRoom'

interface RoomEditorProps {
  rooms: RoomData[]
  activeRoomId: string | null
  onChangeVertices: (roomId: string, vertices: Point[]) => void
  onSelectRoom: (roomId: string) => void
}

const GRID_SIZE = 0.5 // meters
const PX_PER_M = 50 // pixels per meter
const PADDING = 40
const CANVAS_GRID_W = 12 // meters shown
const CANVAS_GRID_H = 10

function snap(val: number): number {
  return Math.round(val / GRID_SIZE) * GRID_SIZE
}

function mToSvg(mx: number, my: number): [number, number] {
  return [PADDING + mx * PX_PER_M, PADDING + (CANVAS_GRID_H - my) * PX_PER_M]
}

function svgToM(sx: number, sy: number): [number, number] {
  return [
    snap((sx - PADDING) / PX_PER_M),
    snap(CANVAS_GRID_H - (sy - PADDING) / PX_PER_M),
  ]
}

export function RoomEditor({ rooms, activeRoomId, onChangeVertices, onSelectRoom }: RoomEditorProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [dragging, setDragging] = useState<{ roomId: string; vertexIdx: number } | null>(null)

  const svgW = CANVAS_GRID_W * PX_PER_M + PADDING * 2
  const svgH = CANVAS_GRID_H * PX_PER_M + PADDING * 2

  const activeRoom = rooms.find((r) => r.id === activeRoomId)

  const getSvgPoint = useCallback((e: React.MouseEvent): [number, number] => {
    const svg = svgRef.current!
    const rect = svg.getBoundingClientRect()
    const scaleX = svgW / rect.width
    const scaleY = svgH / rect.height
    return [
      (e.clientX - rect.left) * scaleX,
      (e.clientY - rect.top) * scaleY,
    ]
  }, [svgW, svgH])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const [sx, sy] = getSvgPoint(e)

    // Check if clicking on any room's vertex
    for (const room of rooms) {
      for (let i = 0; i < room.vertices.length; i++) {
        const [vx, vy] = mToSvg(room.vertices[i].x, room.vertices[i].y)
        if (Math.hypot(sx - vx, sy - vy) < 12) {
          if (room.id !== activeRoomId) {
            onSelectRoom(room.id)
          }
          setDragging({ roomId: room.id, vertexIdx: i })
          return
        }
      }
    }

    // Check if clicking inside an inactive room polygon (select it)
    for (const room of rooms) {
      if (room.id === activeRoomId || room.vertices.length < 3) continue
      const [mx, my] = svgToM(sx, sy)
      // Simple bounding box check first
      const xs = room.vertices.map((v) => v.x)
      const ys = room.vertices.map((v) => v.y)
      if (mx >= Math.min(...xs) && mx <= Math.max(...xs) && my >= Math.min(...ys) && my <= Math.max(...ys)) {
        onSelectRoom(room.id)
        return
      }
    }

    // Add new vertex to active room
    if (activeRoom) {
      const [mx, my] = svgToM(sx, sy)
      if (mx >= 0 && mx <= CANVAS_GRID_W && my >= 0 && my <= CANVAS_GRID_H) {
        onChangeVertices(activeRoom.id, [...activeRoom.vertices, { x: mx, y: my }])
      }
    }
  }, [rooms, activeRoomId, activeRoom, onChangeVertices, onSelectRoom, getSvgPoint])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return
    const [sx, sy] = getSvgPoint(e)
    const [mx, my] = svgToM(sx, sy)
    const clampedX = Math.max(0, Math.min(CANVAS_GRID_W, mx))
    const clampedY = Math.max(0, Math.min(CANVAS_GRID_H, my))
    const room = rooms.find((r) => r.id === dragging.roomId)
    if (!room) return
    const newVerts = [...room.vertices]
    newVerts[dragging.vertexIdx] = { x: clampedX, y: clampedY }
    onChangeVertices(dragging.roomId, newVerts)
  }, [dragging, rooms, onChangeVertices, getSvgPoint])

  const handleMouseUp = useCallback(() => {
    setDragging(null)
  }, [])

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (!activeRoom) return
    const [sx, sy] = getSvgPoint(e)
    for (let i = 0; i < activeRoom.vertices.length; i++) {
      const [vx, vy] = mToSvg(activeRoom.vertices[i].x, activeRoom.vertices[i].y)
      if (Math.hypot(sx - vx, sy - vy) < 12) {
        if (activeRoom.vertices.length > 3) {
          onChangeVertices(activeRoom.id, activeRoom.vertices.filter((_, idx) => idx !== i))
        }
        return
      }
    }
  }, [activeRoom, onChangeVertices, getSvgPoint])

  // Grid lines
  const gridLines = []
  for (let x = 0; x <= CANVAS_GRID_W; x += GRID_SIZE) {
    const [sx] = mToSvg(x, 0)
    gridLines.push(
      <line key={`gv-${x}`} x1={sx} y1={PADDING} x2={sx} y2={PADDING + CANVAS_GRID_H * PX_PER_M}
        stroke="hsl(var(--border))" strokeWidth={x % 1 === 0 ? 0.8 : 0.3} opacity={x % 1 === 0 ? 0.6 : 0.3} />
    )
  }
  for (let y = 0; y <= CANVAS_GRID_H; y += GRID_SIZE) {
    const [, sy] = mToSvg(0, y)
    gridLines.push(
      <line key={`gh-${y}`} x1={PADDING} y1={sy} x2={PADDING + CANVAS_GRID_W * PX_PER_M} y2={sy}
        stroke="hsl(var(--border))" strokeWidth={y % 1 === 0 ? 0.8 : 0.3} opacity={y % 1 === 0 ? 0.6 : 0.3} />
    )
  }

  // Axis labels
  const axisLabels = []
  for (let x = 0; x <= CANVAS_GRID_W; x += 2) {
    const [sx] = mToSvg(x, 0)
    axisLabels.push(
      <text key={`lx-${x}`} x={sx} y={PADDING + CANVAS_GRID_H * PX_PER_M + 16}
        textAnchor="middle" style={{ font: '10px var(--font-sans)', fill: 'hsl(var(--muted-foreground))' }}>
        {x}m
      </text>
    )
  }
  for (let y = 0; y <= CANVAS_GRID_H; y += 2) {
    const [, sy] = mToSvg(0, y)
    axisLabels.push(
      <text key={`ly-${y}`} x={PADDING - 8} y={sy + 4}
        textAnchor="end" style={{ font: '10px var(--font-sans)', fill: 'hsl(var(--muted-foreground))' }}>
        {y}m
      </text>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs text-muted-foreground">
        Дарж цэг нэмэх · Чирж зөөх · Давхар дарж устгах · Өрөө дарж сонгох
      </div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${svgW} ${svgH}`}
        className="w-full cursor-crosshair rounded-lg border bg-background"
        style={{ maxHeight: 480 }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
      >
        {gridLines}
        {axisLabels}

        {/* Render all rooms */}
        {rooms.map((room) => {
          const isActive = room.id === activeRoomId
          const verts = room.vertices
          if (verts.length < 2) return null

          const polyPoints = verts.map((v) => mToSvg(v.x, v.y).join(',')).join(' ')
          const area = verts.length >= 3 ? polygonArea(verts) : 0

          // Room centroid for label
          const cx = verts.reduce((s, v) => s + v.x, 0) / verts.length
          const cy = verts.reduce((s, v) => s + v.y, 0) / verts.length
          const [labelX, labelY] = mToSvg(cx, cy)

          return (
            <g key={room.id} opacity={isActive ? 1 : 0.45}>
              {/* Room polygon fill */}
              {verts.length >= 3 && (
                <polygon
                  points={polyPoints}
                  fill={room.color}
                  fillOpacity={isActive ? 0.15 : 0.08}
                  stroke={room.color}
                  strokeWidth={isActive ? 2.5 : 1.5}
                  strokeLinejoin="round"
                  style={{ cursor: isActive ? 'default' : 'pointer' }}
                />
              )}

              {/* Edge when only 2 vertices */}
              {verts.length === 2 && (
                <line
                  x1={mToSvg(verts[0].x, verts[0].y)[0]} y1={mToSvg(verts[0].x, verts[0].y)[1]}
                  x2={mToSvg(verts[1].x, verts[1].y)[0]} y2={mToSvg(verts[1].x, verts[1].y)[1]}
                  stroke={room.color} strokeWidth={2} strokeDasharray="4 3"
                />
              )}

              {/* Edge lengths for active room */}
              {isActive && verts.length >= 3 && verts.map((v, i) => {
                const next = verts[(i + 1) % verts.length]
                const len = Math.hypot(next.x - v.x, next.y - v.y)
                const [sx1, sy1] = mToSvg(v.x, v.y)
                const [sx2, sy2] = mToSvg(next.x, next.y)
                return (
                  <text key={`edge-${room.id}-${i}`}
                    x={(sx1 + sx2) / 2} y={(sy1 + sy2) / 2 - 6}
                    textAnchor="middle"
                    style={{ font: 'bold 10px var(--font-sans)', fill: room.color }}>
                    {len.toFixed(1)}m
                  </text>
                )
              })}

              {/* Obstacles */}
              {room.obstacles.map((obs) => {
                if (obs.vertices.length < 3) return null
                const obsPts = obs.vertices.map((v) => mToSvg(v.x, v.y).join(',')).join(' ')
                const ocx = obs.vertices.reduce((s, v) => s + v.x, 0) / obs.vertices.length
                const ocy = obs.vertices.reduce((s, v) => s + v.y, 0) / obs.vertices.length
                const [olx, oly] = mToSvg(ocx, ocy)
                return (
                  <g key={obs.id}>
                    <polygon points={obsPts}
                      fill="hsl(var(--destructive) / 0.15)"
                      stroke="hsl(var(--destructive) / 0.6)"
                      strokeWidth={1.5}
                      strokeDasharray="3 2"
                    />
                    <text x={olx} y={oly + 3} textAnchor="middle"
                      style={{ font: '8px var(--font-sans)', fill: 'hsl(var(--destructive))' }}>
                      {obs.label}
                    </text>
                  </g>
                )
              })}

              {/* Room name label */}
              {verts.length >= 3 && (
                <g>
                  <rect
                    x={labelX - 40} y={labelY - 8}
                    width={80} height={area > 0 ? 28 : 16}
                    rx={4} fill="hsl(var(--background))" fillOpacity={0.85}
                  />
                  <text x={labelX} y={labelY + 4} textAnchor="middle"
                    style={{ font: 'bold 11px var(--font-sans)', fill: room.color }}>
                    {room.name}
                  </text>
                  {area > 0 && (
                    <text x={labelX} y={labelY + 16} textAnchor="middle"
                      style={{ font: '9px var(--font-sans)', fill: 'hsl(var(--muted-foreground))' }}>
                      {area.toFixed(1)} m²
                    </text>
                  )}
                </g>
              )}

              {/* Vertices */}
              {(isActive || dragging?.roomId === room.id) && verts.map((v, i) => {
                const [sx, sy] = mToSvg(v.x, v.y)
                const isDraggingThis = dragging?.roomId === room.id && dragging.vertexIdx === i
                return (
                  <g key={`v-${room.id}-${i}`}>
                    <circle cx={sx} cy={sy}
                      r={isDraggingThis ? 8 : 6}
                      fill={isDraggingThis ? room.color : 'hsl(var(--background))'}
                      stroke={room.color} strokeWidth={2}
                      style={{ cursor: 'grab' }}
                    />
                    <text x={sx} y={sy + 3} textAnchor="middle"
                      style={{
                        font: 'bold 8px var(--font-sans)',
                        fill: isDraggingThis ? 'white' : room.color,
                        pointerEvents: 'none',
                      }}>
                      {i + 1}
                    </text>
                  </g>
                )
              })}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
