import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AddTransactionInput, Transaction } from '../context/appContextCore'
import { api } from '../lib/api'

const TRANSACTIONS_KEY = ['transactions'] as const

export function useTransactions(enabled: boolean) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: TRANSACTIONS_KEY,
    queryFn: () => api.getTransactions() as Promise<Transaction[]>,
    enabled,
  })

  const createMutation = useMutation({
    mutationFn: (data: AddTransactionInput) =>
      api.createTransaction({
        material_id: data.materialId,
        type: data.type,
        quantity: data.quantity,
        notes: data.notes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY })
      queryClient.invalidateQueries({ queryKey: ['materials'] })
    },
  })

  return {
    transactions: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    addTransaction: createMutation.mutateAsync,
  }
}
