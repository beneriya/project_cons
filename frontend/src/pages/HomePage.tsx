import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { IconPackage, IconCircleCheck, IconAlertTriangle, IconArrowsSort, IconChartBar, IconMap, IconReceipt, IconArrowUp, IconArrowDown } from '@tabler/icons-react'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { Widget } from '../components/Widget'
import { useApp } from '../context/appContext'

export default function HomePage() {
  const { materials, transactions } = useApp()

  const stats = useMemo(() => {
    const totalMaterials = materials.length
    const inStock = materials.filter(m => m.quantity > m.minThreshold).length
    const lowStock = materials.filter(m => m.quantity > 0 && m.quantity <= m.minThreshold).length
    const currentMonth = new Date().getMonth()
    const transactionsThisMonth = transactions.filter(t => {
      const transactionMonth = new Date(t.date).getMonth()
      return transactionMonth === currentMonth
    }).length
    return { totalMaterials, inStock, lowStock, transactionsThisMonth }
  }, [materials, transactions])

  const lowStockItems = materials.filter(m => m.quantity > 0 && m.quantity <= m.minThreshold)
  const recentTransactions = transactions.slice(0, 5)

  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Нүүр цэс
        </h1>
        <p className="text-sm text-muted-foreground max-w-xl">
          Тавтай морил! Танай паркетын агуулахын тойм мэдээлэл энд байна.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Widget
          icon={<IconPackage size={22} />}
          value={stats.totalMaterials}
          label="Нийт материал"
          color="blue"
        />
        <Widget
          icon={<IconCircleCheck size={22} />}
          value={stats.inStock}
          label="Бэлэн байгаа материал"
          color="green"
        />
        <Widget
          icon={<IconAlertTriangle size={22} />}
          value={stats.lowStock}
          label="Бараа дуусахад ойр"
          color="red"
        />
        <Widget
          icon={<IconArrowsSort size={22} />}
          value={stats.transactionsThisMonth}
          label="Энэ сард хийсэн шилжүүлэг"
          color="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-[var(--theme-surface-shadow)] transition-shadow duration-200 hover:shadow-[var(--theme-card-hover)]">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 className="text-base font-semibold text-foreground">Нөөц багассан материал</h3>
            <Badge variant="low-stock" className="gap-1">
              <IconAlertTriangle className="size-3.5" />
              {lowStockItems.length} материал
            </Badge>
          </div>
          <div className="p-5">
            {lowStockItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-emerald-500/10 p-3 mb-3">
                  <IconCircleCheck className="size-6 text-emerald-600" />
                </div>
                <p className="text-sm font-medium text-foreground">Бүх материал бэлэн байна</p>
                <p className="text-xs text-muted-foreground mt-0.5">Нөөц багассан материал алга</p>
              </div>
            ) : (
              lowStockItems.map(item => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-3.5 border-b border-border/50 gap-3 last:border-b-0 transition-colors hover:bg-muted/30 -mx-5 px-5 rounded-lg"
                >
                  <div>
                    <div className="font-medium text-sm">{item.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{item.type}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-destructive">{item.quantity} boxes</div>
                    <div className="text-xs text-muted-foreground">Хамгийн бага: {item.minThreshold}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-[var(--theme-surface-shadow)] transition-shadow duration-200 hover:shadow-[var(--theme-card-hover)]">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 className="text-base font-semibold text-foreground">Сүүлд хийсэн шилжүүлэг</h3>
            <Button asChild variant="secondary" size="sm">
              <Link to="/transactions">Бүгдийг харах</Link>
            </Button>
          </div>
          <div className="p-5">
            {recentTransactions.map(transaction => (
              <div
                key={transaction.id}
                className="flex items-center justify-between py-3.5 border-b border-border/50 gap-3 last:border-b-0 transition-colors hover:bg-muted/30 -mx-5 px-5 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Badge variant={transaction.type === 'IN' ? 'in' : 'out'} className="gap-1">
                    {transaction.type === 'IN' ? (
                      <IconArrowUp className="size-3.5" />
                    ) : (
                      <IconArrowDown className="size-3.5" />
                    )}
                    {transaction.type}
                  </Badge>
                  <div>
                    <div className="font-medium text-sm">{transaction.materialName}</div>
                    <div className="text-xs text-muted-foreground">{transaction.date}</div>
                  </div>
                </div>
                <div className="text-sm font-semibold">{transaction.quantity} хайрцаг</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-[var(--theme-surface-shadow)] p-6">
        <h3 className="text-base font-semibold text-foreground">Түргэн үйлдлүүд</h3>
        <div className="flex flex-wrap gap-3 mt-4">
          <Button asChild>
            <Link to="/inventory" className="inline-flex items-center gap-2">
              <IconPackage className="size-4" />
              Агуулах удирдах
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/planner" className="inline-flex items-center gap-2">
              <IconMap className="size-4" />
              Тооцоолуур
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/transactions" className="inline-flex items-center gap-2">
              <IconReceipt className="size-4" />
              Шилжүүлэг нэмэх
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/reports" className="inline-flex items-center gap-2">
              <IconChartBar className="size-4" />
              Тайлан харах
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
