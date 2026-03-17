import { useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { useApp, type Material } from '../context/appContext'
import { Button } from '../components/Button'
import { Badge } from '../components/Badge'
import { Input, Select } from '../components/Input'
import { IconPlus, IconPencil, IconTrash } from '@tabler/icons-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DataTable } from '@/components/data-table'

function createColumns(
  onEdit: (m: Material) => void,
  onDelete: (id: string) => void
): ColumnDef<Material>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Material',
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.type}</span>
      ),
    },
    {
      accessorKey: 'm2PerBox',
      header: 'm²/Box',
      cell: ({ row }) => `${row.original.m2PerBox} m²`,
    },
    {
      accessorKey: 'quantity',
      header: 'Boxes',
    },
    {
      accessorKey: 'price',
      header: 'Price',
      cell: ({ row }) => `₮${row.original.price.toLocaleString()}`,
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const m = row.original
        if (m.quantity === 0) {
          return <Badge variant="out-of-stock">Out of Stock</Badge>
        }
        if (m.quantity <= m.minThreshold) {
          return <Badge variant="low-stock">Low Stock</Badge>
        }
        return <Badge variant="in-stock">In Stock</Badge>
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(row.original)}
            title="Edit"
          >
            <IconPencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(row.original.id)}
            title="Delete"
            className="text-destructive hover:bg-destructive/10"
          >
            <IconTrash className="size-4" />
          </Button>
        </div>
      ),
    },
  ]
}

export default function InventoryPage() {
  const { materials, addMaterial, updateMaterial, deleteMaterial, loading } =
    useApp()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    type: 'Laminate' as Material['type'],
    m2PerBox: '',
    piecesPerBox: '',
    quantity: '',
    price: '',
    minThreshold: '',
  })

  const handleOpenModal = (material?: Material) => {
    if (material) {
      setEditingMaterial(material)
      setFormData({
        name: material.name,
        type: material.type,
        m2PerBox: material.m2PerBox.toString(),
        piecesPerBox: material.piecesPerBox.toString(),
        quantity: material.quantity.toString(),
        price: material.price.toString(),
        minThreshold: material.minThreshold.toString(),
      })
    } else {
      setEditingMaterial(null)
      setFormData({
        name: '',
        type: 'Laminate',
        m2PerBox: '',
        piecesPerBox: '',
        quantity: '',
        price: '',
        minThreshold: '',
      })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const materialData = {
      name: formData.name,
      type: formData.type,
      m2PerBox: parseFloat(formData.m2PerBox),
      piecesPerBox: parseInt(formData.piecesPerBox, 10),
      quantity: parseInt(formData.quantity, 10),
      price: parseFloat(formData.price),
      minThreshold: parseInt(formData.minThreshold, 10),
    }
    try {
      if (editingMaterial) {
        await updateMaterial(editingMaterial.id, materialData)
      } else {
        await addMaterial(materialData)
      }
      setIsModalOpen(false)
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this material?')) {
      try {
        await deleteMaterial(id)
      } catch (err) {
        console.error(err)
      }
    }
  }

  const columns = createColumns(handleOpenModal, handleDelete)

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">Inventory</h1>
          <p className="text-sm text-muted-foreground max-w-xl">
            Manage your parquet flooring materials and stock levels
          </p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <IconPlus className="size-4" />
          <span>Add Material</span>
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={materials}
        loading={loading}
        searchColumn="name"
        searchPlaceholder="Search materials..."
      />

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {editingMaterial ? 'Edit Material' : 'Add New Material'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4 items-start">
              <Input
                label="Material Name"
                placeholder="e.g. Oak Parquet Classic"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
              <Select
                label="Material Type"
                value={formData.type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e.target.value as Material['type'],
                  })
                }
                required
              >
                <option value="Laminate">Laminate Parquet</option>
                <option value="Solid Wood">Solid Wood Parquet</option>
                <option value="Engineered">Engineered Wood</option>
                <option value="SPC">SPC / WPC</option>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-4 items-start">
              <Input
                label="m² per Box"
                type="number"
                step="0.1"
                placeholder="2.4"
                value={formData.m2PerBox}
                onChange={(e) =>
                  setFormData({ ...formData, m2PerBox: e.target.value })
                }
                required
              />
              <Input
                label="Pieces per Box"
                type="number"
                placeholder="12"
                value={formData.piecesPerBox}
                onChange={(e) =>
                  setFormData({ ...formData, piecesPerBox: e.target.value })
                }
                required
              />
              <Input
                label="Current Quantity"
                type="number"
                placeholder="48"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: e.target.value })
                }
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4 items-start">
              <Input
                label="Price (₮)"
                type="number"
                placeholder="24500"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                required
              />
              <Input
                label="Minimum Threshold"
                type="number"
                placeholder="10"
                value={formData.minThreshold}
                onChange={(e) =>
                  setFormData({ ...formData, minThreshold: e.target.value })
                }
                hint="Alert when stock falls below this level"
                required
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingMaterial ? 'Update' : 'Add Material'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
