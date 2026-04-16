/**
 * API client for ParquetPro backend.
 * Maps snake_case API responses to camelCase for frontend.
 */

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000/api/v1'

const TOKEN_KEY = 'parquet_token'
const USER_KEY = 'parquet_user'

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function getStoredUser(): { id: string; name: string; email: string } | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function setStoredUser(user: { id: string; name: string; email: string }): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options?.headers,
  }
  const token = getToken()
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  if (res.status === 401) {
    clearToken()
    throw new Error('Unauthorized')
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail))
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

// Map API snake_case to frontend camelCase
function toMaterial(raw: Record<string, unknown>) {
  return {
    id: raw.id,
    name: raw.name,
    type: raw.type,
    m2PerBox: raw.m2_per_box,
    piecesPerBox: raw.pieces_per_box,
    quantity: raw.quantity,
    price: raw.price,
    minThreshold: raw.min_threshold,
  }
}

function toTransaction(raw: Record<string, unknown>) {
  return {
    id: raw.id,
    materialId: raw.material_id,
    materialName: raw.material_name,
    type: raw.type,
    date: raw.date,
    quantity: raw.quantity,
    notes: raw.notes,
  }
}

export const api = {
  async login(email: string, password: string) {
    const data = await fetchApi<{ access_token: string; user: { id: string; name: string; email: string } }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) }
    )
    setToken(data.access_token)
    setStoredUser(data.user)
    return data.user
  },

  async register(name: string, email: string, password: string) {
    const data = await fetchApi<{ access_token: string; user: { id: string; name: string; email: string } }>(
      '/auth/register',
      { method: 'POST', body: JSON.stringify({ name, email, password }) }
    )
    setToken(data.access_token)
    setStoredUser(data.user)
    return data.user
  },

  logout() {
    clearToken()
  },

  isAuthenticated(): boolean {
    return !!getToken()
  },

  async getMaterials(search?: string, type?: string) {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (type && type !== 'all') params.set('type', type)
    const q = params.toString() ? `?${params}` : ''
    const list = await fetchApi<Record<string, unknown>[]>(`/materials${q}`)
    return list.map(toMaterial)
  },

  async getMaterial(id: string) {
    const raw = await fetchApi<Record<string, unknown>>(`/materials/${id}`)
    return toMaterial(raw)
  },

  async createMaterial(data: {
    name: string
    type: string
    m2_per_box: number
    pieces_per_box: number
    quantity: number
    price: number
    min_threshold: number
  }) {
    const raw = await fetchApi<Record<string, unknown>>('/materials', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return toMaterial(raw)
  },

  async updateMaterial(id: string, data: Partial<Record<string, unknown>>) {
    const payload: Record<string, unknown> = {}
    if (data.name != null) payload.name = data.name
    if (data.type != null) payload.type = data.type
    if (data.m2PerBox != null) payload.m2_per_box = data.m2PerBox
    if (data.piecesPerBox != null) payload.pieces_per_box = data.piecesPerBox
    if (data.quantity != null) payload.quantity = data.quantity
    if (data.price != null) payload.price = data.price
    if (data.minThreshold != null) payload.min_threshold = data.minThreshold
    const raw = await fetchApi<Record<string, unknown>>(`/materials/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
    return toMaterial(raw)
  },

  async deleteMaterial(id: string) {
    await fetchApi(`/materials/${id}`, { method: 'DELETE' })
  },

  async getTransactions(limit?: number) {
    const q = limit ? `?limit=${limit}` : ''
    const list = await fetchApi<Record<string, unknown>[]>(`/transactions${q}`)
    return list.map(toTransaction)
  },

  async createTransaction(data: { material_id: string; type: string; quantity: number; notes?: string }) {
    const raw = await fetchApi<Record<string, unknown>>('/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return toTransaction(raw)
  },

  async getDashboard() {
    return fetchApi<Record<string, unknown>>('/dashboard')
  },

  async optimizeLayout(data: { width_m: number; height_m: number; waste_percentage: number }) {
    return fetchApi<{
      required_area_m2: number
      waste_percentage: number
      area_with_waste_m2: number
      naive_material_id: string
      naive_material_name: string
      naive_boxes: number
      naive_cost: number
      naive_m2_covered: number
      optimized_allocations: {
        material_id: string
        material_name: string
        boxes: number
        m2_covered: number
        cost: number
        price_per_box: number
        m2_per_box: number
      }[]
      optimized_total_cost: number
      optimized_total_m2: number
      optimized_total_boxes: number
      cost_savings: number
      savings_percentage: number
    }>('/layout/optimize', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
}
