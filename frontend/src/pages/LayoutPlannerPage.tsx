import { useState, useRef, useMemo } from 'react'
import { useApp } from '../context/appContext'
import { Button } from '../components/Button'
import { Input, Select } from '../components/Input'
import { Card, CardContent } from '@/components/ui/card'
import { IconDownload, IconCube, IconLayout2 } from '@tabler/icons-react'
import {
  calculateMaterials,
  MAX_ROOM_DIM,
  ROOM_PRESETS,
  type LayoutPattern,
} from '@/lib/plannerCalculations'
import { FloorPreview } from '@/components/planner/FloorPreview'
import { FloorPreview3D } from '@/components/planner/FloorPreview3D'

interface MaterialForLayout {
  id: string
  name: string
  m2PerBox: number
  piecesPerBox: number
  price: number
  quantity: number
}

/** Preview dimensions: cap to MAX_ROOM_DIM while preserving aspect ratio */
function getPreviewDimensions(width: number, height: number): [number, number] {
  if (width <= MAX_ROOM_DIM && height <= MAX_ROOM_DIM) return [width, height]
  const scale = MAX_ROOM_DIM / Math.max(width, height)
  return [width * scale, height * scale]
}

const LAYOUT_PATTERNS: { value: LayoutPattern; label: string }[] = [
  { value: 'straight-h', label: 'Straight (horizontal)' },
  { value: 'straight-v', label: 'Straight (vertical)' },
  { value: 'diagonal', label: 'Diagonal' },
]

export default function LayoutPlannerPage() {
  const previewRef = useRef<HTMLDivElement>(null)
  const { materials } = useApp()
  const [floorPlan, setFloorPlan] = useState({
    width: 5,
    height: 4,
    materialId: '',
    wastePercentage: 10,
    pattern: 'straight-h' as LayoutPattern,
    view3D: true,
  })

  const selectedMaterial = materials.find(
    (m) => m.id === floorPlan.materialId
  ) as MaterialForLayout | undefined

  const calculation = useMemo(() => {
    if (!selectedMaterial || floorPlan.width <= 0 || floorPlan.height <= 0) return null
    return calculateMaterials(
      floorPlan.width,
      floorPlan.height,
      selectedMaterial.m2PerBox,
      selectedMaterial.piecesPerBox,
      selectedMaterial.price,
      floorPlan.wastePercentage,
      floorPlan.pattern
    )
  }, [floorPlan.width, floorPlan.height, floorPlan.wastePercentage, floorPlan.pattern, selectedMaterial])

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
        a.download = `floor-plan-${floorPlan.width}x${floorPlan.height}.png`
        a.click()
      }
      URL.revokeObjectURL(url)
    }
    img.src = url
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">Layout Planner</h1>
        <p className="text-sm text-muted-foreground max-w-xl">
          Design your floor and calculate required materials
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Input Panel */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="mb-4 text-lg font-semibold">Room Dimensions</h3>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {ROOM_PRESETS.map((p) => (
                  <Button
                    key={p.label}
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setFloorPlan((s) => ({
                        ...s,
                        width: p.width,
                        height: p.height,
                      }))
                    }
                  >
                    {p.label}
                  </Button>
                ))}
              </div>
              <Input
                label="Width (meters)"
                type="number"
                step="0.1"
                min={0.1}
                max={MAX_ROOM_DIM}
                value={floorPlan.width}
                onChange={(e) =>
                  setFloorPlan((s) => ({
                    ...s,
                    width: parseFloat(e.target.value) || 0,
                  }))
                }
                hint={floorPlan.width > MAX_ROOM_DIM ? `Preview limited to ${MAX_ROOM_DIM}m` : undefined}
              />
              <Input
                label="Height (meters)"
                type="number"
                step="0.1"
                min={0.1}
                max={MAX_ROOM_DIM}
                value={floorPlan.height}
                onChange={(e) =>
                  setFloorPlan((s) => ({
                    ...s,
                    height: parseFloat(e.target.value) || 0,
                  }))
                }
                hint={floorPlan.height > MAX_ROOM_DIM ? `Preview limited to ${MAX_ROOM_DIM}m` : undefined}
              />
              <Select
                label="Layout Pattern"
                value={floorPlan.pattern}
                onChange={(e) =>
                  setFloorPlan((s) => ({
                    ...s,
                    pattern: e.target.value as LayoutPattern,
                  }))
                }
              >
                {LAYOUT_PATTERNS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </Select>
              <Select
                label="Parquet Type"
                value={floorPlan.materialId}
                onChange={(e) =>
                  setFloorPlan((s) => ({ ...s, materialId: e.target.value }))
                }
              >
                <option value="">Select a material...</option>
                {(materials as MaterialForLayout[]).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.m2PerBox}m² per box)
                  </option>
                ))}
              </Select>
              <Input
                label="Waste Percentage"
                type="number"
                min={0}
                max={50}
                value={floorPlan.wastePercentage}
                onChange={(e) =>
                  setFloorPlan((s) => ({
                    ...s,
                    wastePercentage: parseInt(e.target.value, 10) || 0,
                  }))
                }
                hint="Recommended: 10-15% straight, 15-20% diagonal"
              />
            </div>
          </CardContent>
        </Card>

        {/* Floor Preview */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {selectedMaterial && (
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{selectedMaterial.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {selectedMaterial.m2PerBox}m²/box · ₮
                      {selectedMaterial.price.toLocaleString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardContent className="pt-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-semibold">Floor Preview</h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant={floorPlan.view3D ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() =>
                      setFloorPlan((s) => ({ ...s, view3D: true }))
                    }
                  >
                    <IconCube size={14} className="mr-1.5" />
                    3D View
                  </Button>
                  <Button
                    variant={!floorPlan.view3D ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() =>
                      setFloorPlan((s) => ({ ...s, view3D: false }))
                    }
                  >
                    <IconLayout2 size={14} className="mr-1.5" />
                    2D Plan
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExport}
                    disabled={
                      floorPlan.width <= 0 ||
                      floorPlan.height <= 0 ||
                      floorPlan.view3D
                    }
                  >
                    <IconDownload size={14} className="mr-1.5" />
                    Export PNG
                  </Button>
                </div>
              </div>
              {(floorPlan.width > MAX_ROOM_DIM || floorPlan.height > MAX_ROOM_DIM) && (
                <p className="mb-2 text-xs text-muted-foreground">
                  Preview scaled to fit {MAX_ROOM_DIM}m max for performance. Material calculation uses full dimensions.
                </p>
              )}
              <div ref={previewRef} className="flex h-[440px] w-full min-w-0 shrink-0 flex-col overflow-hidden">
                {floorPlan.view3D && selectedMaterial ? (
                  <FloorPreview3D
                    width={getPreviewDimensions(floorPlan.width, floorPlan.height)[0]}
                    height={getPreviewDimensions(floorPlan.width, floorPlan.height)[1]}
                    m2PerBox={selectedMaterial.m2PerBox}
                    piecesPerBox={selectedMaterial.piecesPerBox}
                    pattern={floorPlan.pattern}
                  />
                ) : selectedMaterial ? (
                  <FloorPreview
                    width={getPreviewDimensions(floorPlan.width, floorPlan.height)[0]}
                    height={getPreviewDimensions(floorPlan.width, floorPlan.height)[1]}
                    m2PerBox={selectedMaterial.m2PerBox}
                    piecesPerBox={selectedMaterial.piecesPerBox}
                    pattern={floorPlan.pattern}
                  />
                ) : (
                  <div className="flex min-h-[400px] items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30">
                    <p className="text-sm text-muted-foreground">
                      Select a parquet material to see the floor layout
                    </p>
                  </div>
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
            <h3 className="mb-4 text-lg font-semibold">
              Material Calculation Results
            </h3>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
              <div className="rounded-lg bg-muted p-4">
                <div className="mb-1 text-xs text-muted-foreground">
                  Room Area
                </div>
                <div className="text-2xl font-bold">
                  {calculation.totalArea.toFixed(1)} m²
                </div>
              </div>
              <div className="rounded-lg bg-muted p-4">
                <div className="mb-1 text-xs text-muted-foreground">
                  With Waste
                </div>
                <div className="text-2xl font-bold">
                  {calculation.areaWithWaste.toFixed(1)} m²
                </div>
              </div>
              <div className="rounded-lg bg-muted p-4">
                <div className="mb-1 text-xs text-muted-foreground">
                  Tiles Needed
                </div>
                <div className="text-2xl font-bold text-primary">
                  {calculation.tilesNeeded}
                </div>
              </div>
              <div className="rounded-lg bg-muted p-4">
                <div className="mb-1 text-xs text-muted-foreground">
                  Boxes Needed
                </div>
                <div className="text-2xl font-bold text-primary">
                  {calculation.boxesNeeded}
                </div>
              </div>
              <div className="rounded-lg bg-primary/10 p-4">
                <div className="mb-1 text-xs text-primary">Total Cost</div>
                <div className="text-2xl font-bold">
                  ₮{calculation.totalCost.toLocaleString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
