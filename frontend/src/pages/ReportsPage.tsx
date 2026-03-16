import { useMemo } from 'react'
import { useApp } from '../context/appContext'
import { Button } from '../components/Button'
import { FileDown, FileSpreadsheet } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

export default function ReportsPage() {
  const { materials, transactions } = useApp()

  const chartData = useMemo(() => {
    const typeDistribution = materials.reduce((acc: { name: string; value: number }[], material) => {
      const existing = acc.find(item => item.name === material.type)
      if (existing) {
        existing.value += material.quantity
      } else {
        acc.push({ name: material.type, value: material.quantity })
      }
      return acc
    }, [])

    const monthlyData: Record<string, { IN: number; OUT: number }> = {}
    transactions.forEach(transaction => {
      const month = new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      if (!monthlyData[month]) {
        monthlyData[month] = { IN: 0, OUT: 0 }
      }
      monthlyData[month][transaction.type] += transaction.quantity
    })

    const monthlyTransactions = Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        IN: data.IN,
        OUT: data.OUT,
      }))
      .reverse()
      .slice(0, 6)
      .reverse()

    const stockLevels = materials.map(material => ({
      name: material.name.length > 20 ? material.name.substring(0, 20) + '...' : material.name,
      quantity: material.quantity,
      threshold: material.minThreshold,
    }))

    return { typeDistribution, monthlyTransactions, stockLevels }
  }, [materials, transactions])

  const COLORS = ['#2563C4', '#22C27A', '#F59E0B', '#E03E3E', '#6B9FE4']

  const handleExportPDF = () => {
    alert('PDF export functionality would be implemented here')
  }

  const handleExportExcel = () => {
    alert('Excel export functionality would be implemented here')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-['Syne'] text-[48px] font-extrabold text-[#0B1E3D] leading-tight">
            Reports
          </h1>
          <p className="text-[#8A93A8] mt-2">
            Visual analytics and insights for inventory management
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={handleExportPDF}>
            <FileDown size={16} className="mr-2" />
            Export PDF
          </Button>
          <Button variant="secondary" onClick={handleExportExcel}>
            <FileSpreadsheet size={16} className="mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Monthly Transactions Chart */}
      <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(11,30,61,0.07)] p-6 mb-6">
        <h3 className="font-['Syne'] text-lg font-semibold text-[#0B1E3D] mb-6">
          Monthly Stock Movements
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData.monthlyTransactions}>
            <CartesianGrid strokeDasharray="3 3" stroke="#D9DEEA" />
            <XAxis dataKey="month" stroke="#8A93A8" style={{ fontSize: '12px' }} />
            <YAxis stroke="#8A93A8" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #D9DEEA',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Bar dataKey="IN" fill="#22C27A" name="Stock In" radius={[8, 8, 0, 0]} />
            <Bar dataKey="OUT" fill="#E03E3E" name="Stock Out" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Material Type Distribution */}
        <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(11,30,61,0.07)] p-6">
          <h3 className="font-['Syne'] text-lg font-semibold text-[#0B1E3D] mb-6">
            Material Distribution by Type
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData.typeDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.typeDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Stock Levels */}
        <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(11,30,61,0.07)] p-6">
          <h3 className="font-['Syne'] text-lg font-semibold text-[#0B1E3D] mb-6">
            Current Stock Levels vs. Threshold
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.stockLevels} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#D9DEEA" />
              <XAxis type="number" stroke="#8A93A8" style={{ fontSize: '11px' }} />
              <YAxis dataKey="name" type="category" width={120} stroke="#8A93A8" style={{ fontSize: '11px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #D9DEEA',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="quantity" fill="#2563C4" name="Current Stock" radius={[0, 8, 8, 0]} />
              <Bar dataKey="threshold" fill="#F59E0B" name="Min Threshold" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(11,30,61,0.07)] p-6">
        <h3 className="font-['Syne'] text-lg font-semibold text-[#0B1E3D] mb-4">
          Summary Statistics
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-[#F4F6FA] rounded-lg">
            <div className="text-xs text-[#8A93A8] mb-1">Total Materials</div>
            <div className="font-['Syne'] text-2xl font-bold text-[#0B1E3D]">
              {materials.length}
            </div>
          </div>

          <div className="p-4 bg-[#F4F6FA] rounded-lg">
            <div className="text-xs text-[#8A93A8] mb-1">Total Stock (boxes)</div>
            <div className="font-['Syne'] text-2xl font-bold text-[#0B1E3D]">
              {materials.reduce((sum, m) => sum + m.quantity, 0)}
            </div>
          </div>

          <div className="p-4 bg-[#F4F6FA] rounded-lg">
            <div className="text-xs text-[#8A93A8] mb-1">Total Transactions</div>
            <div className="font-['Syne'] text-2xl font-bold text-[#0B1E3D]">
              {transactions.length}
            </div>
          </div>

          <div className="p-4 bg-[#F4F6FA] rounded-lg">
            <div className="text-xs text-[#8A93A8] mb-1">Total Inventory Value</div>
            <div className="font-['Syne'] text-2xl font-bold text-[#0B1E3D]">
              ₮{materials.reduce((sum, m) => sum + m.quantity * m.price, 0).toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
