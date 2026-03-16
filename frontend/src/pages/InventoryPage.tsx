import { useState, useMemo } from 'react'
import { useApp, type Material } from '../context/appContext'
import { Button } from '../components/Button'
import { Badge } from '../components/Badge'
import { Input, Select } from '../components/Input'
import { Search, Plus, Edit2, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'

export default function InventoryPage() {
  const { materials, addMaterial, updateMaterial, deleteMaterial } = useApp()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
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

  const filteredMaterials = useMemo(() => {
    return materials.filter(material => {
      const matchesSearch = material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          material.type.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesFilter = filterType === 'all' || material.type === filterType
      return matchesSearch && matchesFilter
    })
  }, [materials, searchTerm, filterType])

  const getStatusBadge = (material: Material) => {
    if (material.quantity === 0) {
      return <Badge variant="out-of-stock">✕ Out of Stock</Badge>
    } else if (material.quantity <= material.minThreshold) {
      return <Badge variant="low-stock">⚠ Low Stock</Badge>
    } else {
      return <Badge variant="in-stock">✔ In Stock</Badge>
    }
  }

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

  const handleSubmit = (e: React.FormEvent) => {
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

    if (editingMaterial) {
      updateMaterial(editingMaterial.id, materialData)
    } else {
      addMaterial(materialData)
    }

    setIsModalOpen(false)
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this material?')) {
      deleteMaterial(id)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-['Syne'] text-[48px] font-extrabold text-[#0B1E3D] leading-tight">
            Inventory
          </h1>
          <p className="text-[#8A93A8] mt-2">
            Manage your parquet flooring materials and stock levels
          </p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus size={16} className="mr-2" />
          Add Material
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(11,30,61,0.07)] p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A93A8]" />
            <input
              type="text"
              placeholder="Search materials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border-[1.5px] border-[#D9DEEA] text-sm bg-[#F4F6FA] outline-none transition-colors focus:border-[#2563C4] focus:bg-white"
            />
          </div>

          <Select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">All Types</option>
            <option value="Laminate">Laminate</option>
            <option value="Solid Wood">Solid Wood</option>
            <option value="Engineered">Engineered</option>
            <option value="SPC">SPC</option>
            <option value="WPC">WPC</option>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(11,30,61,0.07)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#0B1E3D]">
              <tr>
                <th className="px-4 py-3.5 text-left font-['Syne'] text-[11px] font-semibold tracking-[0.1em] uppercase text-[#6B9FE4]">
                  Material Name
                </th>
                <th className="px-4 py-3.5 text-left font-['Syne'] text-[11px] font-semibold tracking-[0.1em] uppercase text-[#6B9FE4]">
                  Type
                </th>
                <th className="px-4 py-3.5 text-left font-['Syne'] text-[11px] font-semibold tracking-[0.1em] uppercase text-[#6B9FE4]">
                  m² / Box
                </th>
                <th className="px-4 py-3.5 text-left font-['Syne'] text-[11px] font-semibold tracking-[0.1em] uppercase text-[#6B9FE4]">
                  Boxes
                </th>
                <th className="px-4 py-3.5 text-left font-['Syne'] text-[11px] font-semibold tracking-[0.1em] uppercase text-[#6B9FE4]">
                  Price (₮)
                </th>
                <th className="px-4 py-3.5 text-left font-['Syne'] text-[11px] font-semibold tracking-[0.1em] uppercase text-[#6B9FE4]">
                  Status
                </th>
                <th className="px-4 py-3.5 text-left font-['Syne'] text-[11px] font-semibold tracking-[0.1em] uppercase text-[#6B9FE4]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredMaterials.map((material) => (
                <tr key={material.id} className="border-b border-[#F4F6FA] hover:bg-[#F4F6FA] transition-colors">
                  <td className="px-4 py-3.5">
                    <strong className="text-sm text-[#0B1E3D]">{material.name}</strong>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-[#0B1E3D]">{material.type}</td>
                  <td className="px-4 py-3.5 text-sm text-[#0B1E3D]">{material.m2PerBox} m²</td>
                  <td className="px-4 py-3.5 text-sm text-[#0B1E3D]">{material.quantity}</td>
                  <td className="px-4 py-3.5 text-sm text-[#0B1E3D]">{material.price.toLocaleString()}</td>
                  <td className="px-4 py-3.5">
                    {getStatusBadge(material)}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenModal(material)}
                        className="p-2 hover:bg-[#D6E4FA] rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={16} className="text-[#2563C4]" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(material.id)}
                        className="p-2 hover:bg-[#FEE2E2] rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} className="text-[#E03E3E]" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredMaterials.length === 0 && (
          <div className="text-center py-12 text-[#8A93A8]">
            No materials found
          </div>
        )}
      </div>

      {/* Add/Edit Material Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingMaterial ? 'Edit Material' : 'Add New Material'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Material Name"
                placeholder="e.g. Oak Parquet Classic"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />

              <Select
                label="Material Type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as Material['type'] })}
                required
              >
                <option value="Laminate">Laminate Parquet</option>
                <option value="Solid Wood">Solid Wood Parquet</option>
                <option value="Engineered">Engineered Wood</option>
                <option value="SPC">SPC / WPC</option>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Input
                label="m² per Box"
                type="number"
                step="0.1"
                placeholder="2.4"
                value={formData.m2PerBox}
                onChange={(e) => setFormData({ ...formData, m2PerBox: e.target.value })}
                required
              />

              <Input
                label="Pieces per Box"
                type="number"
                placeholder="12"
                value={formData.piecesPerBox}
                onChange={(e) => setFormData({ ...formData, piecesPerBox: e.target.value })}
                required
              />

              <Input
                label="Current Quantity"
                type="number"
                placeholder="48"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Price (₮)"
                type="number"
                placeholder="24500"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />

              <Input
                label="Minimum Threshold"
                type="number"
                placeholder="10"
                value={formData.minThreshold}
                onChange={(e) => setFormData({ ...formData, minThreshold: e.target.value })}
                hint="Alert when stock falls below this level"
                required
              />
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingMaterial ? 'Update Material' : 'Add Material'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
