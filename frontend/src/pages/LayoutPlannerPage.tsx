import { useState, useRef, useEffect, useCallback } from 'react'
import { useApp } from '../context/appContext'
import { Button } from '../components/Button'
import { Input, Select } from '../components/Input'
import { Calculator, Download } from 'lucide-react'

interface FloorPlan {
  width: number
  height: number
  materialId: string
  wastePercentage: number
}

/** Material shape used for layout calculations (m2PerBox, piecesPerBox, price, quantity). */
interface MaterialForLayout {
  id: string
  name: string
  m2PerBox: number
  piecesPerBox: number
  price: number
  quantity: number
}

export default function LayoutPlannerPage() {
  const { materials } = useApp()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [floorPlan, setFloorPlan] = useState<FloorPlan>({
    width: 5,
    height: 4,
    materialId: '',
    wastePercentage: 10,
  })
  const [calculation, setCalculation] = useState<{
    totalArea: number
    areaWithWaste: number
    tilesNeeded: number
    boxesNeeded: number
    totalCost: number
  } | null>(null)

  const selectedMaterial = materials.find(m => m.id === floorPlan.materialId) as MaterialForLayout | undefined

  const drawFloorPlan = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const padding = 40
    const availableWidth = canvas.width - padding * 2
    const availableHeight = canvas.height - padding * 2

    const scaleX = availableWidth / floorPlan.width
    const scaleY = availableHeight / floorPlan.height
    const scale = Math.min(scaleX, scaleY, 80)

    const roomWidth = floorPlan.width * scale
    const roomHeight = floorPlan.height * scale
    const offsetX = (canvas.width - roomWidth) / 2
    const offsetY = (canvas.height - roomHeight) / 2

    ctx.strokeStyle = '#0B1E3D'
    ctx.lineWidth = 3
    ctx.strokeRect(offsetX, offsetY, roomWidth, roomHeight)

    ctx.fillStyle = '#F4F6FA'
    ctx.fillRect(offsetX, offsetY, roomWidth, roomHeight)

    if (selectedMaterial) {
      const tileWidth = Math.sqrt(selectedMaterial.m2PerBox / selectedMaterial.piecesPerBox) * scale
      const tileHeight = tileWidth

      ctx.strokeStyle = '#8A93A8'
      ctx.lineWidth = 0.5

      for (let x = offsetX; x < offsetX + roomWidth; x += tileWidth) {
        for (let y = offsetY; y < offsetY + roomHeight; y += tileHeight) {
          const w = Math.min(tileWidth, offsetX + roomWidth - x)
          const h = Math.min(tileHeight, offsetY + roomHeight - y)

          const shade =
            (Math.floor(x / tileWidth) + Math.floor(y / tileHeight)) % 2 === 0 ? '#D6E4FA' : '#C5D9F2'
          ctx.fillStyle = shade
          ctx.fillRect(x, y, w, h)
          ctx.strokeRect(x, y, w, h)
        }
      }
    }

    ctx.fillStyle = '#0B1E3D'
    ctx.font = '14px "DM Sans", sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    ctx.fillText(`${floorPlan.width}m`, canvas.width / 2, offsetY - 20)

    ctx.save()
    ctx.translate(offsetX - 20, canvas.height / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText(`${floorPlan.height}m`, 0, 0)
    ctx.restore()

    ctx.font = 'bold 18px "Syne", sans-serif'
    ctx.fillStyle = '#2563C4'
    ctx.fillText(`${floorPlan.width * floorPlan.height} m²`, canvas.width / 2, canvas.height - 20)
  }, [floorPlan, selectedMaterial])

  useEffect(() => {
    drawFloorPlan()
  }, [drawFloorPlan])

  const handleCalculate = () => {
    if (!selectedMaterial) return

    const totalArea = floorPlan.width * floorPlan.height
    const wasteMultiplier = 1 + floorPlan.wastePercentage / 100
    const areaWithWaste = totalArea * wasteMultiplier
    const boxesNeeded = Math.ceil(areaWithWaste / selectedMaterial.m2PerBox)
    const tilesNeeded = boxesNeeded * selectedMaterial.piecesPerBox
    const totalCost = boxesNeeded * selectedMaterial.price

    setCalculation({
      totalArea,
      areaWithWaste,
      tilesNeeded,
      boxesNeeded,
      totalCost,
    })
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-['Syne'] text-[48px] font-extrabold text-[#0B1E3D] leading-tight">
          Layout Planner
        </h1>
        <p className="text-[#8A93A8] mt-2">
          Design your floor and calculate required materials
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Panel */}
        <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(11,30,61,0.07)] p-6">
          <h3 className="font-['Syne'] text-lg font-semibold text-[#0B1E3D] mb-4">
            Room Dimensions
          </h3>

          <div className="space-y-4">
            <Input
              label="Width (meters)"
              type="number"
              step="0.1"
              min={0.1}
              value={floorPlan.width}
              onChange={(e) => setFloorPlan({ ...floorPlan, width: parseFloat(e.target.value) || 0 })}
            />

            <Input
              label="Height (meters)"
              type="number"
              step="0.1"
              min={0.1}
              value={floorPlan.height}
              onChange={(e) => setFloorPlan({ ...floorPlan, height: parseFloat(e.target.value) || 0 })}
            />

            <Select
              label="Parquet Type"
              value={floorPlan.materialId}
              onChange={(e) => setFloorPlan({ ...floorPlan, materialId: e.target.value })}
            >
              <option value="">Select a material...</option>
              {(materials as unknown as MaterialForLayout[]).map(material => (
                <option key={material.id} value={material.id}>
                  {material.name} ({material.m2PerBox}m² per box)
                </option>
              ))}
            </Select>

            <Input
              label="Waste Percentage"
              type="number"
              min={0}
              max={50}
              value={floorPlan.wastePercentage}
              onChange={(e) => setFloorPlan({ ...floorPlan, wastePercentage: parseInt(e.target.value, 10) || 0 })}
              hint="Recommended: 10-15% for straight layouts, 15-20% for diagonal"
            />

            <Button
              onClick={handleCalculate}
              className="w-full"
              disabled={!floorPlan.materialId || floorPlan.width <= 0 || floorPlan.height <= 0}
            >
              <Calculator size={16} className="mr-2" />
              Calculate Materials
            </Button>
          </div>
        </div>

        {/* Canvas Panel */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-[0_2px_12px_rgba(11,30,61,0.07)] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-['Syne'] text-lg font-semibold text-[#0B1E3D]">
              Floor Preview
            </h3>
            <Button variant="secondary" size="sm" className="text-xs px-3 py-1.5">
              <Download size={14} className="mr-1.5" />
              Export
            </Button>
          </div>

          <canvas
            ref={canvasRef}
            width={700}
            height={500}
            className="w-full border border-[#D9DEEA] rounded-lg"
          />
        </div>
      </div>

      {/* Calculation Results */}
      {calculation && (
        <div className="mt-6 bg-white rounded-2xl shadow-[0_2px_12px_rgba(11,30,61,0.07)] p-6">
          <h3 className="font-['Syne'] text-lg font-semibold text-[#0B1E3D] mb-4">
            Material Calculation Results
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-[#F4F6FA] rounded-lg p-4">
              <div className="text-xs text-[#8A93A8] mb-1">Room Area</div>
              <div className="font-['Syne'] text-2xl font-bold text-[#0B1E3D]">
                {calculation.totalArea.toFixed(1)} m²
              </div>
            </div>

            <div className="bg-[#F4F6FA] rounded-lg p-4">
              <div className="text-xs text-[#8A93A8] mb-1">With Waste</div>
              <div className="font-['Syne'] text-2xl font-bold text-[#0B1E3D]">
                {calculation.areaWithWaste.toFixed(1)} m²
              </div>
            </div>

            <div className="bg-[#F4F6FA] rounded-lg p-4">
              <div className="text-xs text-[#8A93A8] mb-1">Tiles Needed</div>
              <div className="font-['Syne'] text-2xl font-bold text-[#2563C4]">
                {calculation.tilesNeeded}
              </div>
            </div>

            <div className="bg-[#F4F6FA] rounded-lg p-4">
              <div className="text-xs text-[#8A93A8] mb-1">Boxes Needed</div>
              <div className="font-['Syne'] text-2xl font-bold text-[#2563C4]">
                {calculation.boxesNeeded}
              </div>
            </div>

            <div className="bg-[#D6E4FA] rounded-lg p-4">
              <div className="text-xs text-[#1A3A6B] mb-1">Total Cost</div>
              <div className="font-['Syne'] text-2xl font-bold text-[#0B1E3D]">
                ₮{calculation.totalCost.toLocaleString()}
              </div>
            </div>
          </div>

          {selectedMaterial && calculation.boxesNeeded > selectedMaterial.quantity && (
            <div className="mt-4 p-4 bg-[#FEF3C7] border border-[#F59E0B] rounded-lg">
              <div className="flex items-start gap-2">
                <span className="text-[#92400E]">⚠️</span>
                <div>
                  <div className="font-medium text-sm text-[#92400E]">Insufficient Stock</div>
                  <div className="text-xs text-[#92400E] mt-1">
                    You need {calculation.boxesNeeded} boxes but only {selectedMaterial.quantity} are available.
                    Please order {calculation.boxesNeeded - selectedMaterial.quantity} more boxes.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
