import api from './client'

export interface Project {
  id: string
  project_type: string
  zip_code: string
  scope: Record<string, unknown>
  preferences: Record<string, unknown>
  cost_estimate_low: number | null
  cost_estimate_high: number | null
  cost_confidence: number | null
  status: string
  tier: number
  created_at: string
}

export interface Contractor {
  id: string
  business_name: string
  slug: string
  phone: string
  email: string
  website: string | null
  zip_code: string
  specialties: string[]
  license_status: string
  insurance_verified: boolean
  years_in_business: number
  composite_score: number
  score_breakdown: Record<string, number>
}

export interface CostEstimate {
  low: number
  high: number
  confidence: number
  project_type: string
  zip_code: string
}

export const projectsApi = {
  create: (data: { project_type: string; zip_code: string; scope: Record<string, unknown>; preferences: Record<string, unknown> }) =>
    api.post('/projects', data),
  get: (id: string) => api.get(`/projects/${id}`),
  update: (id: string, data: Partial<Project>) => api.patch(`/projects/${id}`, data),
  matchContractors: (id: string) => api.post(`/projects/${id}/match`),
  getContractors: (id: string) => api.get(`/projects/${id}/contractors`),
  estimate: (data: { project_type: string; zip_code: string; scope: Record<string, unknown> }) =>
    api.post('/estimates', data),
}

export const contractorsApi = {
  search: (params: { zip_code?: string; project_type?: string; page?: number; per_page?: number }) =>
    api.get('/contractors', { params }),
  get: (id: string) => api.get(`/contractors/${id}`),
  getReviews: (id: string) => api.get(`/contractors/${id}/reviews`),
}
