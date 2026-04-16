import { useState, useRef, useMemo, useCallback } from 'react'
import { useApp } from '../context/appContext'
import { Button } from '../components/Button'
import { Input, Select } from '../components/Input'
import { Card, CardContent } from '@/components/ui/card'
import {
  IconDownload, IconCube, IconLayout2, IconBulb, IconArrowRight,
  IconPolygon, IconSquare, IconPlus, IconTrash, IconHome,
} from '@tabler/icons-react'
import {
  calculateMaterials,
  MAX_ROOM_DIM,
  ROOM_PRESETS,
  type LayoutPattern,
} from '@/lib/plannerCalculations'
import {
  POLYGON_PRESETS,
  MULTI_ROOM_PRESETS,
  OBSTACLE_PRESETS,
  polygonArea,
  roomNetArea,
  calculatePolygonMaterials,
  createRoom,
  createObstacle,
  type Point,
  type RoomData,
  type Obstacle,
} from '@/lib/polygonRoom'
import { FloorPreview } from '@/components/planner/FloorPreview'
import { FloorPreview3D } from '@/components/planner/FloorPreview3D'
import { FloorPreviewPolygon } from '@/components/planner/FloorPreviewPolygon'
import { FloorPreview3DPolygon } from '@/components/planner/FloorPreview3DPolygon'
import { RoomEditor } from '@/components/planner/RoomEditor'
import { api } from '@/lib/api'

interface MaterialForLayout {
  id: string
  name: string
  m2PerBox: number
  piecesPerBox: number
  price: number
  quantity: number
}

function getPreviewDimensions(width: number, height: number): [number, number] {
  if (width <= MAX_ROOM_DIM && height <= MAX_ROOM_DIM) return [width, height]
  const scale = MAX_ROOM_DIM / Math.max(width, height)
  return [width * scale, height * scale]
}

const LAYOUT_PATTERNS: { value: LayoutPattern; label: string }[] = [
  { value: 'straight-h', label: 'Шулуун (хэвтээ)' },
  { value: 'straight-v', label: 'Шулуун (босоо)' },
  { value: 'diagonal', label: 'Диагональ' },
]

type RoomMode = 'rectangle' | 'multiroom'

export default function LayoutPlannerPage() {
  const previewRef = useRef<HTMLDivElement>(null)
  const { materials } = useApp()

  const [roomMode, setRoomMode] = useState<RoomMode>('rectangle')
  const [view3D, setView3D] = useState(true)

  // Rectangle mode
  const [floorPlan, setFloorPlan] = useState({
    width: 5,
    height: 4,
    materialId: '',
    wastePercentage: 10,
    pattern: 'straight-h' as LayoutPattern,
  })

  // Multi-room mode
  const [rooms, setRooms] = useState<RoomData[]>(() => {
    const preset = MULTI_ROOM_PRESETS[0]
    return preset.rooms.map((r, i) => createRoom(r.name, r.vertices, i))
  })
  const [activeRoomId, setActiveRoomId] = useState<string | null>(() => rooms[0]?.id ?? null)

  const activeRoom = rooms.find((r) => r.id === activeRoomId)

  const selectedMaterial = materials.find(
    (m) => m.id === floorPlan.materialId
  ) as MaterialForLayout | undefined

  // Update room field
  const updateRoom = useCallback((roomId: string, updates: Partial<RoomData>) => {
    setRooms((prev) => prev.map((r) => r.id === roomId ? { ...r, ...updates } : r))
  }, [])

  const addRoom = useCallback(() => {
    const newRoom = createRoom(`Өрөө ${rooms.length + 1}`, [], rooms.length)
    setRooms((prev) => [...prev, newRoom])
    setActiveRoomId(newRoom.id)
  }, [rooms.length])

  const removeRoom = useCallback((roomId: string) => {
    setRooms((prev) => {
      const next = prev.filter((r) => r.id !== roomId)
      if (activeRoomId === roomId) {
        setActiveRoomId(next[0]?.id ?? null)
      }
      return next
    })
  }, [activeRoomId])

  const loadMultiRoomPreset = useCallback((presetIdx: number) => {
    const preset = MULTI_ROOM_PRESETS[presetIdx]
    const newRooms = preset.rooms.map((r, i) => {
      const obs = (r.obstacles ?? []).map((o) => createObstacle(o.label, o.vertices))
      return createRoom(r.name, r.vertices, i, obs)
    })
    setRooms(newRooms)
    setActiveRoomId(newRooms[0]?.id ?? null)
  }, [])

  const addObstacle = useCallback((roomId: string, presetIdx: number) => {
    setRooms((prev) => prev.map((r) => {
      if (r.id !== roomId) return r
      // Place obstacle at room centroid
      const cx = r.vertices.reduce((s, v) => s + v.x, 0) / r.vertices.length
      const cy = r.vertices.reduce((s, v) => s + v.y, 0) / r.vertices.length
      const verts = OBSTACLE_PRESETS[presetIdx].build(cx, cy)
      const obs = createObstacle(OBSTACLE_PRESETS[presetIdx].label, verts)
      return { ...r, obstacles: [...r.obstacles, obs] }
    }))
  }, [])

  const removeObstacle = useCallback((roomId: string, obsId: string) => {
    setRooms((prev) => prev.map((r) => {
      if (r.id !== roomId) return r
      return { ...r, obstacles: r.obstacles.filter((o) => o.id !== obsId) }
    }))
  }, [])

  // Calculations
  const rectCalculation = useMemo(() => {
    if (roomMode !== 'rectangle' || !selectedMaterial || floorPlan.width <= 0 || floorPlan.height <= 0) return null
    return calculateMaterials(
      floorPlan.width, floorPlan.height,
      selectedMaterial.m2PerBox, selectedMaterial.piecesPerBox,
      selectedMaterial.price, floorPlan.wastePercentage, floorPlan.pattern
    )
  }, [roomMode, floorPlan, selectedMaterial])

  // Multi-room: per-room calculations
  const roomCalculations = useMemo(() => {
    if (roomMode !== 'multiroom') return []
    return rooms.map((room) => {
      const mat = materials.find((m) => m.id === room.materialId) as MaterialForLayout | undefined
      if (!mat || room.vertices.length < 3) return { room, calc: null, material: mat }
      const calc = calculatePolygonMaterials(
        room.vertices, mat.m2PerBox, mat.piecesPerBox, mat.price,
        room.wastePercentage, room.pattern, room.obstacles
      )
      return { room, calc, material: mat }
    })
  }, [roomMode, rooms, materials])

  const multiRoomTotals = useMemo(() => {
    const calcs = roomCalculations.filter((rc) => rc.calc !== null)
    return {
      totalArea: calcs.reduce((s, rc) => s + rc.calc!.totalArea, 0),
      areaWithWaste: calcs.reduce((s, rc) => s + rc.calc!.areaWithWaste, 0),
      tilesNeeded: calcs.reduce((s, rc) => s + rc.calc!.tilesNeeded, 0),
      boxesNeeded: calcs.reduce((s, rc) => s + rc.calc!.boxesNeeded, 0),
      totalCost: calcs.reduce((s, rc) => s + rc.calc!.totalCost, 0),
      roomCount: calcs.length,
    }
  }, [roomCalculations])

  const calculation = roomMode === 'rectangle' ? rectCalculation : (multiRoomTotals.roomCount > 0 ? multiRoomTotals : null)
  const currentArea = roomMode === 'rectangle'
    ? floorPlan.width * floorPlan.height
    : rooms.reduce((s, r) => s + (r.vertices.length >= 3 ? roomNetArea(r.vertices, r.obstacles) : 0), 0)

  // Optimization
  const [optimizeResult, setOptimizeResult] = useState<Awaited<ReturnType<typeof api.optimizeLayout>> | null>(null)
  const [optimizeLoading, setOptimizeLoading] = useState(false)
  const [optimizeError, setOptimizeError] = useState<string | null>(null)

  const handleOptimize = async () => {
    if (currentArea <= 0) return
    setOptimizeLoading(true)
    setOptimizeError(null)
    try {
      const side = Math.sqrt(currentArea)
      const avgWaste = roomMode === 'rectangle'
        ? floorPlan.wastePercentage
        : rooms.length > 0 ? rooms.reduce((s, r) => s + r.wastePercentage, 0) / rooms.length : 10
      const result = await api.optimizeLayout({
        width_m: roomMode === 'rectangle' ? floorPlan.width : side,
        height_m: roomMode === 'rectangle' ? floorPlan.height : side,
        waste_percentage: avgWaste,
      })
      setOptimizeResult(result)
    } catch (err) {
      setOptimizeError(err instanceof Error ? err.message : 'Optimization failed')
    } finally {
      setOptimizeLoading(false)
    }
  }

  const handleExport = () => {
    const svg = previewRef.current?.querySelector('svg')
    if (!svg) return
    const serializer = new XMLSerializer()
    const str = serializer.serializeToString(svg)
    const blob = new Blob([str], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(img, 0, 0)
        const a = document.createElement('a')
        a.href = canvas.toDataURL('image/png')
        a.download = `floor-plan.png`
        a.click()
      }
      URL.revokeObjectURL(url)
    }
    img.src = url
  }

  // For multi-room previews, inject material info into room data
  const roomsWithMaterial = useMemo(() => {
    return rooms.map((r) => {
      const mat = materials.find((m) => m.id === r.materialId) as MaterialForLayout | undefined
      return { ...r, _mat: mat }
    })
  }, [rooms, materials])

  const anyRoomHasMaterial = roomsWithMaterial.some((r) => r._mat && r.vertices.length >= 3)
  const firstMat = roomsWithMaterial.find((r) => r._mat)?._mat

  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">Байршлын төлөвлөгч</h1>
        <p className="text-sm text-muted-foreground max-w-xl">
          Шалаа төлөвлөж, шаардлагатай материалыг тооцоол
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Input Panel */}
        <Card className="lg:row-span-2">
          <CardContent className="pt-6">
            {/* Mode Switcher */}
            <div className="mb-5 flex rounded-lg border p-1">
              <button
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  roomMode === 'rectangle' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setRoomMode('rectangle')}
              >
                <IconSquare size={16} />
                Тэгш өнцөгт
              </button>
              <button
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  roomMode === 'multiroom' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setRoomMode('multiroom')}
              >
                <IconHome size={16} />
                Олон өрөө
              </button>
            </div>

            {roomMode === 'rectangle' ? (
              <div className="space-y-4">
                <h3 className="text-base font-semibold">Өрөөний хэмжээ</h3>
                <div className="flex flex-wrap gap-2">
                  {ROOM_PRESETS.map((p) => (
                    <Button key={p.label} variant="outline" size="sm"
                      onClick={() => setFloorPlan((s) => ({ ...s, width: p.width, height: p.height }))}>
                      {p.label}
                    </Button>
                  ))}
                </div>
                <Input label="Өргөн (m)" type="number" step="0.1" min={0.1} max={MAX_ROOM_DIM}
                  value={floorPlan.width}
                  onChange={(e) => setFloorPlan((s) => ({ ...s, width: parseFloat(e.target.value) || 0 }))} />
                <Input label="Урт (m)" type="number" step="0.1" min={0.1} max={MAX_ROOM_DIM}
                  value={floorPlan.height}
                  onChange={(e) => setFloorPlan((s) => ({ ...s, height: parseFloat(e.target.value) || 0 }))} />
                <Select label="Шалны чиглэл" value={floorPlan.pattern}
                  onChange={(e) => setFloorPlan((s) => ({ ...s, pattern: e.target.value as LayoutPattern }))}>
                  {LAYOUT_PATTERNS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </Select>
                <Select label="Материал" value={floorPlan.materialId}
                  onChange={(e) => setFloorPlan((s) => ({ ...s, materialId: e.target.value }))}>
                  <option value="">Материал сонгоно уу...</option>
                  {(materials as MaterialForLayout[]).map((m) => (
                    <option key={m.id} value={m.id}>{m.name} ({m.m2PerBox}m²/хайрцаг)</option>
                  ))}
                </Select>
                <Input label="Алдагдал (%)" type="number" min={0} max={50}
                  value={floorPlan.wastePercentage}
                  onChange={(e) => setFloorPlan((s) => ({ ...s, wastePercentage: parseInt(e.target.value, 10) || 0 }))}
                  hint="10-15% тэгш, 15-20% диагональ" />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Apartment presets */}
                <h3 className="text-base font-semibold">Байрны загвар</h3>
                <div className="flex flex-wrap gap-2">
                  {MULTI_ROOM_PRESETS.map((p, i) => (
                    <Button key={p.label} variant="outline" size="sm" onClick={() => loadMultiRoomPreset(i)}>
                      {p.label}
                    </Button>
                  ))}
                </div>

                {/* Room editor canvas */}
                <RoomEditor
                  rooms={rooms}
                  activeRoomId={activeRoomId}
                  onChangeVertices={(roomId, verts) => updateRoom(roomId, { vertices: verts })}
                  onSelectRoom={setActiveRoomId}
                />

                {/* Room list */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold">Өрөөнүүд ({rooms.length})</h4>
                    <Button variant="outline" size="sm" onClick={addRoom}>
                      <IconPlus size={14} className="mr-1" /> Нэмэх
                    </Button>
                  </div>
                  {rooms.map((room) => {
                    const isActive = room.id === activeRoomId
                    const area = room.vertices.length >= 3 ? polygonArea(room.vertices) : 0
                    return (
                      <div key={room.id}
                        className={`rounded-lg border p-3 cursor-pointer transition-colors ${
                          isActive ? 'border-primary bg-primary/5' : 'border-muted hover:border-muted-foreground/30'
                        }`}
                        onClick={() => setActiveRoomId(room.id)}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: room.color }} />
                            <input
                              className="bg-transparent text-sm font-medium w-28 outline-none border-b border-transparent focus:border-primary"
                              value={room.name}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => updateRoom(room.id, { name: e.target.value })}
                            />
                            {area > 0 && <span className="text-xs text-muted-foreground">{area.toFixed(1)} m²</span>}
                          </div>
                          {rooms.length > 1 && (
                            <button className="text-muted-foreground hover:text-destructive p-1"
                              onClick={(e) => { e.stopPropagation(); removeRoom(room.id) }}>
                              <IconTrash size={14} />
                            </button>
                          )}
                        </div>
                        {isActive && (
                          <div className="space-y-2 mt-2" onClick={(e) => e.stopPropagation()}>
                            <Select label="Материал" value={room.materialId}
                              onChange={(e) => updateRoom(room.id, { materialId: e.target.value })}>
                              <option value="">Материал сонгоно уу...</option>
                              {(materials as MaterialForLayout[]).map((m) => (
                                <option key={m.id} value={m.id}>{m.name} ({m.m2PerBox}m²)</option>
                              ))}
                            </Select>
                            <div className="grid grid-cols-2 gap-2">
                              <Select label="Чиглэл" value={room.pattern}
                                onChange={(e) => updateRoom(room.id, { pattern: e.target.value as LayoutPattern })}>
                                {LAYOUT_PATTERNS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                              </Select>
                              <Input label="Алдагдал %" type="number" min={0} max={50}
                                value={room.wastePercentage}
                                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                onChange={(e) => updateRoom(room.id, { wastePercentage: parseInt(e.target.value, 10) || 0 })} />
                            </div>

                            {/* Obstacles */}
                            <div className="pt-2 border-t border-muted/50">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-muted-foreground">
                                  Саад тотгор ({room.obstacles.length})
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1 mb-2">
                                {OBSTACLE_PRESETS.map((op, oi) => (
                                  <button key={oi}
                                    className="rounded border px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-muted transition-colors"
                                    onClick={() => addObstacle(room.id, oi)}>
                                    + {op.label}
                                  </button>
                                ))}
                              </div>
                              {room.obstacles.map((obs) => (
                                <div key={obs.id} className="flex items-center justify-between rounded bg-muted/40 px-2 py-1 mb-1 text-xs">
                                  <span>
                                    <span className="inline-block h-2 w-2 rounded-sm bg-red-400/60 mr-1" />
                                    {obs.label} ({polygonArea(obs.vertices).toFixed(2)} m²)
                                  </span>
                                  <button className="text-muted-foreground hover:text-destructive"
                                    onClick={() => removeObstacle(room.id, obs.id)}>
                                    <IconTrash size={12} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Floor Preview */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-semibold">Шалны харагдац</h3>
                <div className="flex items-center gap-2">
                  <Button variant={view3D ? 'secondary' : 'outline'} size="sm"
                    onClick={() => setView3D(true)}>
                    <IconCube size={14} className="mr-1.5" /> 3D
                  </Button>
                  <Button variant={!view3D ? 'secondary' : 'outline'} size="sm"
                    onClick={() => setView3D(false)}>
                    <IconLayout2 size={14} className="mr-1.5" /> 2D
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExport} disabled={view3D}>
                    <IconDownload size={14} className="mr-1.5" /> PNG
                  </Button>
                </div>
              </div>
              <div ref={previewRef} className="flex h-[480px] w-full min-w-0 shrink-0 flex-col overflow-hidden">
                {roomMode === 'rectangle' ? (
                  !selectedMaterial ? (
                    <div className="flex min-h-[400px] items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30">
                      <p className="text-sm text-muted-foreground">Паркетын материал сонгоно уу</p>
                    </div>
                  ) : view3D ? (
                    <FloorPreview3D
                      width={getPreviewDimensions(floorPlan.width, floorPlan.height)[0]}
                      height={getPreviewDimensions(floorPlan.width, floorPlan.height)[1]}
                      m2PerBox={selectedMaterial.m2PerBox}
                      piecesPerBox={selectedMaterial.piecesPerBox}
                      pattern={floorPlan.pattern}
                    />
                  ) : (
                    <FloorPreview
                      width={getPreviewDimensions(floorPlan.width, floorPlan.height)[0]}
                      height={getPreviewDimensions(floorPlan.width, floorPlan.height)[1]}
                      m2PerBox={selectedMaterial.m2PerBox}
                      piecesPerBox={selectedMaterial.piecesPerBox}
                      pattern={floorPlan.pattern}
                    />
                  )
                ) : !anyRoomHasMaterial ? (
                  <div className="flex min-h-[400px] items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30">
                    <p className="text-sm text-muted-foreground">Өрөө бүрт материал сонгоно уу</p>
                  </div>
                ) : view3D ? (
                  <FloorPreview3DPolygon
                    rooms={rooms.filter((r) => r.materialId && r.vertices.length >= 3)}
                    m2PerBox={firstMat?.m2PerBox ?? 2.4}
                    piecesPerBox={firstMat?.piecesPerBox ?? 12}
                  />
                ) : (
                  <FloorPreviewPolygon
                    rooms={rooms.filter((r) => r.materialId && r.vertices.length >= 3)}
                    m2PerBox={firstMat?.m2PerBox ?? 2.4}
                    piecesPerBox={firstMat?.piecesPerBox ?? 12}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Calculation Results */}
      {calculation && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="mb-4 text-lg font-semibold">Материалын тооцоо</h3>

            {/* Per-room breakdown for multi-room */}
            {roomMode === 'multiroom' && roomCalculations.some((rc) => rc.calc) && (
              <div className="mb-4 overflow-x-auto">
                <table className="w-full text-sm mb-3">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 pr-3">Өрөө</th>
                      <th className="pb-2 pr-3">Материал</th>
                      <th className="pb-2 pr-3 text-right">Талбай</th>
                      <th className="pb-2 pr-3 text-right">Хайрцаг</th>
                      <th className="pb-2 text-right">Өртөг</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roomCalculations.map(({ room, calc, material }) => (
                      <tr key={room.id} className="border-b border-muted/50">
                        <td className="py-2 pr-3">
                          <span className="inline-block h-2 w-2 rounded-full mr-1.5" style={{ backgroundColor: room.color }} />
                          {room.name}
                        </td>
                        <td className="py-2 pr-3 text-muted-foreground">{material?.name ?? '—'}</td>
                        <td className="py-2 pr-3 text-right">{calc ? `${calc.totalArea.toFixed(1)} m²` : '—'}</td>
                        <td className="py-2 pr-3 text-right">{calc?.boxesNeeded ?? '—'}</td>
                        <td className="py-2 text-right font-medium">{calc ? `₮${calc.totalCost.toLocaleString()}` : '—'}</td>
                      </tr>
                    ))}
                    <tr className="font-semibold">
                      <td className="pt-2" colSpan={2}>Нийт</td>
                      <td className="pt-2 text-right">{multiRoomTotals.totalArea.toFixed(1)} m²</td>
                      <td className="pt-2 text-right">{multiRoomTotals.boxesNeeded}</td>
                      <td className="pt-2 text-right">₮{multiRoomTotals.totalCost.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
              <div className="rounded-lg bg-muted p-4">
                <div className="mb-1 text-xs text-muted-foreground">Талбай</div>
                <div className="text-2xl font-bold">{calculation.totalArea.toFixed(1)} m²</div>
              </div>
              <div className="rounded-lg bg-muted p-4">
                <div className="mb-1 text-xs text-muted-foreground">Алдагдал оруулсан</div>
                <div className="text-2xl font-bold">{calculation.areaWithWaste.toFixed(1)} m²</div>
              </div>
              <div className="rounded-lg bg-muted p-4">
                <div className="mb-1 text-xs text-muted-foreground">Хавтан</div>
                <div className="text-2xl font-bold text-primary">{calculation.tilesNeeded}</div>
              </div>
              <div className="rounded-lg bg-muted p-4">
                <div className="mb-1 text-xs text-muted-foreground">Хайрцаг</div>
                <div className="text-2xl font-bold text-primary">{calculation.boxesNeeded}</div>
              </div>
              <div className="rounded-lg bg-primary/10 p-4">
                <div className="mb-1 text-xs text-primary">Нийт өртөг</div>
                <div className="text-2xl font-bold">₮{calculation.totalCost.toLocaleString()}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Optimization */}
      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <IconBulb size={20} className="text-amber-500" />
                Өртөг оновчлол (Knapsack алгоритм)
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {roomMode === 'multiroom'
                  ? 'Бүх өрөөний нийт талбайд хамгийн бага өртөгтэй материалын хослолыг олно'
                  : 'Бүх материалыг хослуулан хамгийн бага өртөгтэй хувилбарыг олно'}
              </p>
            </div>
            <Button onClick={handleOptimize} disabled={optimizeLoading || currentArea <= 0}>
              {optimizeLoading ? 'Тооцоолж байна...' : 'Оновчлох'}
            </Button>
          </div>

          {optimizeError && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive mb-4">{optimizeError}</div>
          )}

          {optimizeResult && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl border-2 border-muted p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="inline-block rounded bg-muted px-2 py-0.5 text-xs font-medium">Энгийн арга</span>
                    <span className="text-xs text-muted-foreground">Нэг материал</span>
                  </div>
                  <div className="mb-2 text-sm text-muted-foreground">{optimizeResult.naive_material_name}</div>
                  <div className="text-3xl font-bold text-muted-foreground">₮{optimizeResult.naive_cost.toLocaleString()}</div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    {optimizeResult.naive_boxes} хайрцаг · {optimizeResult.naive_m2_covered.toFixed(1)} m²
                  </div>
                </div>
                <div className="rounded-xl border-2 border-green-500/50 bg-green-500/5 p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="inline-block rounded bg-green-500/20 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-400">
                      Knapsack оновчлол
                    </span>
                    <span className="text-xs text-muted-foreground">Хослол</span>
                  </div>
                  <div className="mb-2 text-sm text-muted-foreground">
                    {optimizeResult.optimized_allocations.length} төрлийн материал
                  </div>
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                    ₮{optimizeResult.optimized_total_cost.toLocaleString()}
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    {optimizeResult.optimized_total_boxes} хайрцаг · {optimizeResult.optimized_total_m2.toFixed(1)} m²
                  </div>
                </div>
              </div>

              {optimizeResult.cost_savings > 0 ? (
                <div className="flex items-center gap-3 rounded-xl bg-green-500/10 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20">
                    <IconArrowRight size={20} className="text-green-600 -rotate-45" />
                  </div>
                  <div>
                    <div className="font-semibold text-green-700 dark:text-green-400">
                      ₮{optimizeResult.cost_savings.toLocaleString()} хэмнэлт ({optimizeResult.savings_percentage.toFixed(1)}%)
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Knapsack алгоритм нь энгийн аргаас илүү оновчтой хувилбар олсон
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-4">
                  <div className="text-sm text-muted-foreground">Нэмэлт хэмнэлт алга</div>
                </div>
              )}

              {optimizeResult.optimized_allocations.length > 0 && (
                <div>
                  <h4 className="mb-3 text-sm font-semibold">Оновчлогдсон хуваарилалт</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-muted-foreground">
                          <th className="pb-2 pr-4">Материал</th>
                          <th className="pb-2 pr-4 text-right">₮/хайрцаг</th>
                          <th className="pb-2 pr-4 text-right">m²/хайрцаг</th>
                          <th className="pb-2 pr-4 text-right">Хайрцаг</th>
                          <th className="pb-2 pr-4 text-right">Талбай</th>
                          <th className="pb-2 text-right">Өртөг</th>
                        </tr>
                      </thead>
                      <tbody>
                        {optimizeResult.optimized_allocations.map((a) => (
                          <tr key={a.material_id} className="border-b border-muted/50">
                            <td className="py-2 pr-4 font-medium">{a.material_name}</td>
                            <td className="py-2 pr-4 text-right">₮{a.price_per_box.toLocaleString()}</td>
                            <td className="py-2 pr-4 text-right">{a.m2_per_box}</td>
                            <td className="py-2 pr-4 text-right">{a.boxes}</td>
                            <td className="py-2 pr-4 text-right">{a.m2_covered.toFixed(1)}</td>
                            <td className="py-2 text-right font-medium">₮{a.cost.toLocaleString()}</td>
                          </tr>
                        ))}
                        <tr className="font-semibold">
                          <td className="pt-2">Нийт</td><td /><td />
                          <td className="pt-2 text-right">{optimizeResult.optimized_total_boxes}</td>
                          <td className="pt-2 text-right">{optimizeResult.optimized_total_m2.toFixed(1)}</td>
                          <td className="pt-2 text-right">₮{optimizeResult.optimized_total_cost.toLocaleString()}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="rounded-lg bg-muted/30 p-4 text-xs text-muted-foreground space-y-1">
                <div className="font-medium text-foreground">Алгоритмын мэдээлэл</div>
                <div>Энгийн: Greedy — нэг хамгийн хямд материал</div>
                <div>Оновчлол: Bounded Knapsack DP — O(N × A × log(B))</div>
                <div>Нийт талбай: {optimizeResult.area_with_waste_m2.toFixed(1)} m² ({optimizeResult.waste_percentage}% алдагдал)</div>
                {roomMode === 'multiroom' && <div>{rooms.length} өрөөний нийт талбайд тооцоолсон</div>}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
