import { useMemo } from 'react'
import { useApp } from '../context/appContext'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { IconAlertTriangle, IconPackage, IconShoppingCart, IconCircleX, IconAlertCircle, IconCircleCheck } from '@tabler/icons-react'

export default function AlertsPage() {
  const { materials } = useApp()

  const alerts = useMemo(() => {
    const outOfStock = materials.filter(m => m.quantity === 0)
    const lowStock = materials.filter(m => m.quantity > 0 && m.quantity <= m.minThreshold)
    const critical = materials.filter(m => m.quantity > 0 && m.quantity <= m.minThreshold / 2)

    return { outOfStock, lowStock, critical }
  }, [materials])

  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Stock Alerts
        </h1>
        <p className="text-sm text-muted-foreground max-w-xl">
          Monitor low stock and out of stock materials
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-6 border-l-4 border-l-destructive shadow-[var(--theme-surface-shadow)] transition-all duration-200 hover:shadow-[var(--theme-card-hover)]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <IconCircleX className="size-5" />
            </div>
            <Badge variant="out-of-stock">{alerts.outOfStock.length}</Badge>
          </div>
          <div className="text-2xl font-bold tabular-nums text-destructive">
            {alerts.outOfStock.length}
          </div>
          <div className="text-sm text-muted-foreground mt-0.5">Out of Stock</div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 border-l-4 border-l-amber-500 shadow-[var(--theme-surface-shadow)] transition-all duration-200 hover:shadow-[var(--theme-card-hover)]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
              <IconAlertTriangle className="size-5" />
            </div>
            <Badge variant="low-stock">{alerts.lowStock.length}</Badge>
          </div>
          <div className="text-2xl font-bold tabular-nums text-amber-600">
            {alerts.lowStock.length}
          </div>
          <div className="text-sm text-muted-foreground mt-0.5">Low Stock</div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 border-l-4 border-l-primary shadow-[var(--theme-surface-shadow)] transition-all duration-200 hover:shadow-[var(--theme-card-hover)]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <IconAlertCircle className="size-5" />
            </div>
            <Badge variant="low-stock">{alerts.critical.length}</Badge>
          </div>
          <div className="text-2xl font-bold tabular-nums text-primary">
            {alerts.critical.length}
          </div>
          <div className="text-sm text-muted-foreground mt-0.5">Critical Level</div>
        </div>
      </div>

      {/* Out of Stock Materials */}
      {alerts.outOfStock.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-[var(--theme-surface-shadow)]">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <IconPackage className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">
                Out of Stock Materials
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">These items need immediate restocking</p>
            </div>
          </div>

          <div className="p-6 space-y-3">
            {alerts.outOfStock.map(material => (
              <div
                key={material.id}
                className="flex items-center justify-between p-4 rounded-xl bg-destructive/5 border border-destructive/20 transition-colors hover:bg-destructive/10"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge variant="out-of-stock" className="gap-1 shrink-0">
                      <IconCircleX className="size-3.5" />
                      OUT OF STOCK
                    </Badge>
                    <span className="font-medium text-sm text-foreground">{material.name}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Type: {material.type} • Min threshold: {material.minThreshold} boxes
                  </div>
                </div>
                <Button variant="danger" size="sm" className="shrink-0 ml-4">
                  <IconShoppingCart className="size-3.5 mr-1.5" />
                  Order Now
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Low Stock Materials */}
      {alerts.lowStock.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-[var(--theme-surface-shadow)]">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
              <IconAlertTriangle className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">
                Low Stock Warnings
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Stock levels below minimum threshold</p>
            </div>
          </div>

          <div className="p-6 space-y-3">
            {alerts.lowStock.map(material => {
              const isCritical = material.quantity <= material.minThreshold / 2
              return (
                <div
                  key={material.id}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                    isCritical
                      ? 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/15'
                      : 'bg-muted/50 border-border hover:bg-muted'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge variant="low-stock" className="gap-1 shrink-0">
                        {isCritical ? (
                          <>
                            <IconAlertCircle className="size-3.5" />
                            CRITICAL
                          </>
                        ) : (
                          <>
                            <IconAlertTriangle className="size-3.5" />
                            LOW STOCK
                          </>
                        )}
                      </Badge>
                      <span className="font-medium text-sm text-foreground">{material.name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Current: {material.quantity} boxes • Min: {material.minThreshold} boxes • Type: {material.type}
                    </div>
                    <div className="mt-2 max-w-xs">
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isCritical ? 'bg-destructive' : 'bg-amber-500'
                          }`}
                          style={{ width: `${Math.min(100, (material.quantity / material.minThreshold) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 text-right shrink-0">
                    <div className="text-sm font-semibold text-amber-600">
                      {material.minThreshold - material.quantity} boxes
                    </div>
                    <div className="text-xs text-muted-foreground">needed</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* All Clear */}
      {alerts.outOfStock.length === 0 && alerts.lowStock.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-12 md:p-16 text-center shadow-[var(--theme-surface-shadow)]">
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10">
              <IconCircleCheck className="size-8 text-emerald-600" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-foreground">
                All Stock Levels Healthy
              </h3>
              <p className="text-sm text-muted-foreground">
                No materials are currently below minimum threshold
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
