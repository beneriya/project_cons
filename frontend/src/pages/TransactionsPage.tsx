import { useState } from 'react'
import { useApp } from '../context/appContext'
import { Button } from '../components/Button'
import { Badge } from '../components/Badge'
import { Select, Textarea, Input } from '../components/Input'
import { Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'

export default function TransactionsPage() {
  const { materials, transactions, addTransaction } = useApp()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    materialId: '',
    type: 'IN' as 'IN' | 'OUT',
    quantity: '',
    notes: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const material = materials.find(m => m.id === formData.materialId)
    if (!material) return

    addTransaction({
      materialId: formData.materialId,
      materialName: material.name,
      type: formData.type,
      quantity: parseInt(formData.quantity, 10),
      notes: formData.notes || undefined,
    })

    setIsModalOpen(false)
    setFormData({
      materialId: '',
      type: 'IN',
      quantity: '',
      notes: '',
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-['Syne'] text-[48px] font-extrabold text-[#0B1E3D] leading-tight">
            Transactions
          </h1>
          <p className="text-[#8A93A8] mt-2">
            Track all stock movements and inventory changes
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={16} className="mr-2" />
          Add Transaction
        </Button>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(11,30,61,0.07)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#0B1E3D]">
              <tr>
                <th className="px-4 py-3.5 text-left font-['Syne'] text-[11px] font-semibold tracking-[0.1em] uppercase text-[#6B9FE4]">
                  Date
                </th>
                <th className="px-4 py-3.5 text-left font-['Syne'] text-[11px] font-semibold tracking-[0.1em] uppercase text-[#6B9FE4]">
                  Material
                </th>
                <th className="px-4 py-3.5 text-left font-['Syne'] text-[11px] font-semibold tracking-[0.1em] uppercase text-[#6B9FE4]">
                  Type
                </th>
                <th className="px-4 py-3.5 text-left font-['Syne'] text-[11px] font-semibold tracking-[0.1em] uppercase text-[#6B9FE4]">
                  Quantity
                </th>
                <th className="px-4 py-3.5 text-left font-['Syne'] text-[11px] font-semibold tracking-[0.1em] uppercase text-[#6B9FE4]">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => {
                const material = materials.find(m => m.id === transaction.materialId)
                return (
                  <tr key={transaction.id} className="border-b border-[#F4F6FA] hover:bg-[#F4F6FA] transition-colors">
                    <td className="px-4 py-3.5 text-sm text-[#0B1E3D]">
                      {new Date(transaction.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-sm text-[#0B1E3D]">{transaction.materialName}</div>
                      {material && (
                        <div className="text-xs text-[#8A93A8] mt-0.5">{material.type}</div>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={transaction.type === 'IN' ? 'in' : 'out'}>
                        {transaction.type === 'IN' ? '↑' : '↓'} {transaction.type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-sm font-semibold ${transaction.type === 'IN' ? 'text-[#22C27A]' : 'text-[#E03E3E]'}`}>
                        {transaction.type === 'IN' ? '+' : '-'}{transaction.quantity} boxes
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-[#8A93A8]">
                      {transaction.notes || '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {transactions.length === 0 && (
          <div className="text-center py-12 text-[#8A93A8]">
            No transactions recorded yet
          </div>
        )}
      </div>

      {/* Add Transaction Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Transaction</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <Select
              label="Material"
              value={formData.materialId}
              onChange={(e) => setFormData({ ...formData, materialId: e.target.value })}
              required
            >
              <option value="">Select a material...</option>
              {materials.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.quantity} boxes available)
                </option>
              ))}
            </Select>

            <Select
              label="Transaction Type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as 'IN' | 'OUT' })}
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
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              required
            />

            <Textarea
              label="Notes (optional)"
              rows={3}
              placeholder="Additional remarks..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />

            <div className="flex gap-3 justify-end pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Add Transaction
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
