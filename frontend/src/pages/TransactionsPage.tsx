import { useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { useApp } from '../context/appContext'
import type { Transaction } from '../context/appContextCore'
import { Button } from '../components/Button'
import { Badge } from '../components/Badge'
import { Input, Select, Textarea } from '../components/Input'
import { IconPlus, IconArrowUp, IconArrowDown } from '@tabler/icons-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DataTable } from '@/components/data-table'

const columns: ColumnDef<Transaction>[] = [
  {
    accessorKey: 'date',
    header: 'Date',
    cell: ({ row }) =>
      new Date(row.original.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
  },
  {
    accessorKey: 'materialName',
    header: 'Material',
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.materialName}</div>
      </div>
    ),
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => (
      <Badge variant={row.original.type === 'IN' ? 'in' : 'out'} className="gap-1">
        {row.original.type === 'IN' ? (
          <IconArrowUp className="size-3.5" />
        ) : (
          <IconArrowDown className="size-3.5" />
        )}
        {row.original.type}
      </Badge>
    ),
  },
  {
    accessorKey: 'quantity',
    header: 'Quantity',
    cell: ({ row }) => (
      <span
        className={`font-semibold ${
          row.original.type === 'IN' ? 'text-emerald-600' : 'text-red-600'
        }`}
      >
        {row.original.type === 'IN' ? '+' : '-'}
        {row.original.quantity} boxes
      </span>
    ),
  },
  {
    accessorKey: 'notes',
    header: 'Notes',
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.notes || '—'}
      </span>
    ),
  },
]

export default function TransactionsPage() {
  const { materials, transactions, addTransaction, loading } = useApp()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    materialId: '',
    type: 'IN' as 'IN' | 'OUT',
    quantity: '',
    notes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const material = materials.find((m) => m.id === formData.materialId)
    if (!material) return
    try {
      await addTransaction({
        materialId: formData.materialId,
        materialName: material.name,
        type: formData.type,
        quantity: parseInt(formData.quantity, 10),
        notes: formData.notes || undefined,
      })
      setIsModalOpen(false)
      setFormData({ materialId: '', type: 'IN', quantity: '', notes: '' })
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">Transactions</h1>
          <p className="text-sm text-muted-foreground max-w-xl">
            Track all stock movements and inventory changes
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <IconPlus className="size-4" />
          <span>Add Transaction</span>
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={transactions}
        loading={loading}
        searchColumn="materialName"
        searchPlaceholder="Search by material..."
      />

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Transaction</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <Select
              label="Material"
              value={formData.materialId}
              onChange={(e) =>
                setFormData({ ...formData, materialId: e.target.value })
              }
              required
            >
              <option value="">Select a material...</option>
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.quantity} boxes available)
                </option>
              ))}
            </Select>

            <Select
              label="Transaction Type"
              value={formData.type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type: e.target.value as 'IN' | 'OUT',
                })
              }
              required
            >
              <option value="IN">IN — Stock Received</option>
              <option value="OUT">OUT — Stock Used</option>
            </Select>

            <Input
              label="Quantity (boxes)"
              type="number"
              min={1}
              placeholder="10"
              value={formData.quantity}
              onChange={(e) =>
                setFormData({ ...formData, quantity: e.target.value })
              }
              required
            />

            <Textarea
              label="Notes (optional)"
              rows={3}
              placeholder="Additional remarks..."
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Add Transaction</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
