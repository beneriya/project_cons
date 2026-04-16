import { useCallback, useEffect } from 'react'
import type { ReactNode } from 'react'
import {
  AppContext,
  type AddTransactionInput,
  type AppContextValue,
  type User,
} from './appContextCore'
import { api, getStoredUser } from '../lib/api'
import { useMaterials } from '../hooks/useMaterials'
import { useTransactions } from '../hooks/useTransactions'
import { useState } from 'react'

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getStoredUser())
  const enabled = !!user

  const materialsState = useMaterials(enabled)
  const transactionsState = useTransactions(enabled)

  const logout = useCallback(() => {
    api.logout()
    setUser(null)
  }, [])

  useEffect(() => {
    if (!api.isAuthenticated() && user) {
      setUser(null)
    }
  }, [user])

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const u = await api.login(email, password)
      setUser(u)
      return true
    } catch {
      return false
    }
  }, [])

  const signup = useCallback(async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const u = await api.register(name, email, password)
      setUser(u)
      return true
    } catch {
      return false
    }
  }, [])

  const refresh = useCallback(async () => {
    await Promise.all([materialsState.refetch(), transactionsState.refetch()])
  }, [materialsState.refetch, transactionsState.refetch])

  const addTransaction = useCallback(
    async (data: AddTransactionInput) => {
      await transactionsState.addTransaction(data)
    },
    [transactionsState.addTransaction]
  )

  const value: AppContextValue = {
    materials: materialsState.materials,
    transactions: transactionsState.transactions,
    setMaterials: () => {},
    setTransactions: () => {},
    addMaterial: async (data) => {
      await materialsState.addMaterial(data)
    },
    updateMaterial: materialsState.updateMaterial,
    deleteMaterial: materialsState.deleteMaterial,
    addTransaction,
    user,
    loading: enabled && (materialsState.isLoading || transactionsState.isLoading),
    login,
    signup,
    logout,
    refresh,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
