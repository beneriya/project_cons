import { useMemo } from 'react'
import { useApp } from '../context/appContext'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { AlertTriangle, Package, ShoppingCart } from 'lucide-react'

export default function AlertsPage() {
  const { materials } = useApp()

  const alerts = useMemo(() => {
    const outOfStock = materials.filter(m => m.quantity === 0)
    const lowStock = materials.filter(m => m.quantity > 0 && m.quantity <= m.minThreshold)
    const critical = materials.filter(m => m.quantity > 0 && m.quantity <= m.minThreshold / 2)

    return { outOfStock, lowStock, critical }
  }, [materials])

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-['Syne'] text-[48px] font-extrabold text-[#0B1E3D] leading-tight">
          Stock Alerts
        </h1>
        <p className="text-[#8A93A8] mt-2">
          Monitor low stock and out of stock materials
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(11,30,61,0.07)] p-6 border-l-4 border-[#E03E3E]">
          <div className="flex items-center justify-between mb-3">
            <div className="text-2xl">❌</div>
            <Badge variant="out-of-stock">{alerts.outOfStock.length}</Badge>
          </div>
          <div className="font-['Syne'] text-2xl font-bold text-[#E03E3E]">
            {alerts.outOfStock.length}
          </div>
          <div className="text-sm text-[#8A93A8] mt-1">Out of Stock</div>
        </div>

        <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(11,30,61,0.07)] p-6 border-l-4 border-[#F59E0B]">
          <div className="flex items-center justify-between mb-3">
            <div className="text-2xl">⚠️</div>
            <Badge variant="low-stock">{alerts.lowStock.length}</Badge>
          </div>
          <div className="font-['Syne'] text-2xl font-bold text-[#F59E0B]">
            {alerts.lowStock.length}
          </div>
          <div className="text-sm text-[#8A93A8] mt-1">Low Stock</div>
        </div>

        <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(11,30,61,0.07)] p-6 border-l-4 border-[#2563C4]">
          <div className="flex items-center justify-between mb-3">
            <div className="text-2xl">🔴</div>
            <Badge variant="low-stock">{alerts.critical.length}</Badge>
          </div>
          <div className="font-['Syne'] text-2xl font-bold text-[#2563C4]">
            {alerts.critical.length}
          </div>
          <div className="text-sm text-[#8A93A8] mt-1">Critical Level</div>
        </div>
      </div>

      {/* Out of Stock Materials */}
      {alerts.outOfStock.length > 0 && (
        <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(11,30,61,0.07)] p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#FEE2E2] rounded-lg flex items-center justify-center">
              <Package size={20} className="text-[#E03E3E]" />
            </div>
            <div>
              <h3 className="font-['Syne'] text-lg font-semibold text-[#0B1E3D]">
                Out of Stock Materials
              </h3>
              <p className="text-xs text-[#8A93A8]">These items need immediate restocking</p>
            </div>
          </div>

          <div className="space-y-3">
            {alerts.outOfStock.map(material => (
              <div key={material.id} className="flex items-center justify-between p-4 bg-[#FEE2E2] rounded-lg border border-[#E03E3E]/20">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <Badge variant="out-of-stock">✕ OUT OF STOCK</Badge>
                    <div className="font-medium text-sm text-[#0B1E3D]">{material.name}</div>
                  </div>
                  <div className="text-xs text-[#8A93A8] mt-1">
                    Type: {material.type} • Min threshold: {material.minThreshold} boxes
                  </div>
                </div>
                <Button variant="danger" className="text-xs px-4 py-2">
                  <ShoppingCart size={14} className="mr-1.5" />
                  Order Now
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Low Stock Materials */}
      {alerts.lowStock.length > 0 && (
        <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(11,30,61,0.07)] p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#FEF3C7] rounded-lg flex items-center justify-center">
              <AlertTriangle size={20} className="text-[#F59E0B]" />
            </div>
            <div>
              <h3 className="font-['Syne'] text-lg font-semibold text-[#0B1E3D]">
                Low Stock Warnings
              </h3>
              <p className="text-xs text-[#8A93A8]">Stock levels below minimum threshold</p>
            </div>
          </div>

          <div className="space-y-3">
            {alerts.lowStock.map(material => {
              const isCritical = material.quantity <= material.minThreshold / 2
              return (
                <div
                  key={material.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    isCritical
                      ? 'bg-[#FEF3C7] border-[#F59E0B]/30'
                      : 'bg-[#F4F6FA] border-[#D9DEEA]'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <Badge variant="low-stock">
                        {isCritical ? '🔴 CRITICAL' : '⚠ LOW STOCK'}
                      </Badge>
                      <div className="font-medium text-sm text-[#0B1E3D]">{material.name}</div>
                    </div>
                    <div className="text-xs text-[#8A93A8] mt-1">
                      Current: {material.quantity} boxes • Min: {material.minThreshold} boxes • Type: {material.type}
                    </div>
                    <div className="mt-2">
                      <div className="h-2 bg-[#D9DEEA] rounded-full overflow-hidden">
                        <div
                          className={`h-full ${isCritical ? 'bg-[#E03E3E]' : 'bg-[#F59E0B]'}`}
                          style={{ width: `${Math.min(100, (material.quantity / material.minThreshold) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <div className="text-sm font-semibold text-[#F59E0B]">
                      {material.minThreshold - material.quantity} boxes
                    </div>
                    <div className="text-xs text-[#8A93A8]">needed</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* All Clear */}
      {alerts.outOfStock.length === 0 && alerts.lowStock.length === 0 && (
        <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(11,30,61,0.07)] p-12 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h3 className="font-['Syne'] text-2xl font-bold text-[#22C27A] mb-2">
            All Stock Levels Healthy
          </h3>
          <p className="text-[#8A93A8]">
            No materials are currently below minimum threshold
          </p>
        </div>
      )}
    </div>
  )
}
