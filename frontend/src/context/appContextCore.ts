import { createContext, useContext } from 'react'

export type MaterialType = 'Laminate' | 'Solid Wood' | 'Engineered' | 'SPC' | 'WPC'

export interface Material {
  id: string
  name: string
  type: MaterialType
  m2PerBox: number
  piecesPerBox: number
  quantity: number
  price: number
  minThreshold: number
}

export interface Transaction {
  id: string
  materialId: string
  type: 'IN' | 'OUT'
  date: string
  materialName: string
  quantity: number
  notes?: string
}

export interface User {
  id: string
  name: string
  email: string
}

export type AddMaterialInput = Omit<Material, 'id'>
export type UpdateMaterialInput = Partial<Omit<Material, 'id'>>
export type AddTransactionInput = {
  materialId: string
  materialName: string
  type: 'IN' | 'OUT'
  quantity: number
  notes?: string
}

export interface AppContextValue {
  materials: Material[]
  transactions: Transaction[]
  setMaterials: (m: Material[] | ((prev: Material[]) => Material[])) => void
  setTransactions: (t: Transaction[] | ((prev: Transaction[]) => Transaction[])) => void
  addMaterial: (data: AddMaterialInput) => Promise<void>
  updateMaterial: (id: string, data: UpdateMaterialInput) => Promise<void>
  deleteMaterial: (id: string) => Promise<void>
  addTransaction: (data: AddTransactionInput) => Promise<void>
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<boolean>
  signup: (name: string, email: string, password: string) => Promise<boolean>
  logout: () => void
  refresh: () => Promise<void>
}

export const AppContext = createContext<AppContextValue | null>(null)

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

