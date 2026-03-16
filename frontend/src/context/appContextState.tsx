import type { ReactNode } from 'react'
import { useState } from 'react'
import {
  AppContext,
  type AddMaterialInput,
  type AddTransactionInput,
  type AppContextValue,
  type Material,
  type Transaction,
  type UpdateMaterialInput,
  type User,
} from './appContextCore'

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

const mockMaterials: Material[] = [
  { id: '1', name: 'Parquet 8mm Oak', type: 'Laminate', m2PerBox: 2.4, piecesPerBox: 12, quantity: 8, price: 24500, minThreshold: 10 },
  { id: '2', name: 'Oak Parquet Classic', type: 'Solid Wood', m2PerBox: 2.0, piecesPerBox: 10, quantity: 48, price: 52000, minThreshold: 10 },
  { id: '3', name: 'Walnut Engineered', type: 'Engineered', m2PerBox: 2.2, piecesPerBox: 8, quantity: 5, price: 38000, minThreshold: 8 },
]

const mockTransactions: Transaction[] = [
  { id: '1', materialId: '2', type: 'IN', date: '2025-03-10', materialName: 'Oak Parquet Classic', quantity: 20 },
  { id: '2', materialId: '1', type: 'OUT', date: '2025-03-12', materialName: 'Parquet 8mm Oak', quantity: 4 },
  { id: '3', materialId: '3', type: 'IN', date: '2025-03-14', materialName: 'Walnut Engineered', quantity: 15 },
]

const DEMO_EMAILS = ['admin@parquet.com', 'worker@parquet.com', 'customer@parquet.com']

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [materials, setMaterials] = useState<Material[]>(mockMaterials)
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions)

  const login = (email: string, _password: string) => {
    void _password
    if (!DEMO_EMAILS.includes(email.trim().toLowerCase())) return false
    const name = email.split('@')[0]
    setUser({ id: '1', name, email: email.trim().toLowerCase() })
    return true
  }

  const signup = (_name: string, email: string, _password: string) => {
    void _password
    setUser({ id: '1', name: _name, email })
    return true
  }

  const logout = () => setUser(null)

  const addMaterial = (data: AddMaterialInput) => {
    setMaterials(prev => [...prev, { ...data, id: generateId() }])
  }

  const updateMaterial = (id: string, data: UpdateMaterialInput) => {
    setMaterials(prev => prev.map(m => m.id === id ? { ...m, ...data } : m))
  }

  const deleteMaterial = (id: string) => {
    setMaterials(prev => prev.filter(m => m.id !== id))
  }

  const addTransaction = (data: AddTransactionInput) => {
    const newTx: Transaction = {
      id: generateId(),
      materialId: data.materialId,
      type: data.type,
      date: new Date().toISOString().slice(0, 10),
      materialName: data.materialName,
      quantity: data.quantity,
      notes: data.notes,
    }
    setTransactions(prev => [newTx, ...prev])
    const material = materials.find(m => m.id === data.materialId)
    if (material) {
      setMaterials(prev => prev.map(m =>
        m.id === data.materialId
          ? { ...m, quantity: data.type === 'IN' ? m.quantity + data.quantity : Math.max(0, m.quantity - data.quantity) }
          : m
      ))
    }
  }

  const value: AppContextValue = {
    materials,
    transactions,
    setMaterials,
    setTransactions,
    addMaterial,
    updateMaterial,
    deleteMaterial,
    addTransaction,
    user,
    login,
    signup,
    logout,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
