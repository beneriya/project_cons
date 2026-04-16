import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AddMaterialInput, Material, UpdateMaterialInput } from '../context/appContextCore'
import { api } from '../lib/api'

const MATERIALS_KEY = ['materials'] as const

export function useMaterials(enabled: boolean) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: MATERIALS_KEY,
    queryFn: () => api.getMaterials() as Promise<Material[]>,
    enabled,
  })

  const createMutation = useMutation({
    mutationFn: (data: AddMaterialInput) =>
      api.createMaterial({
        name: data.name,
        type: data.type,
        m2_per_box: data.m2PerBox,
        pieces_per_box: data.piecesPerBox,
        quantity: data.quantity,
        price: data.price,
        min_threshold: data.minThreshold,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MATERIALS_KEY })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMaterialInput }) =>
      api.updateMaterial(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MATERIALS_KEY })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteMaterial(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MATERIALS_KEY })
    },
  })

  return {
    materials: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    addMaterial: createMutation.mutateAsync,
    updateMaterial: async (id: string, data: UpdateMaterialInput) => {
      await updateMutation.mutateAsync({ id, data })
    },
    deleteMaterial: deleteMutation.mutateAsync,
  }
}
