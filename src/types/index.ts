export interface ClientCase {
  id: number
  clientName: string
  caseType: string
  status?: string
  notes?: string
  totalContract?: number
  paralegal?: string
  createdAt: Date | string
  updatedAt: Date | string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export type CaseType = 
  | 'Green Card'
  | 'TN Visa'
  | 'Investor Visa'
  | 'Work Visa'
  | 'National Interest Visa'
  | 'Citizenship'
  | 'FOIA'
  | 'Consular-Embassy Process'
  | 'DACA'
  | 'Fiance(e) Visa'
  | 'Tourist Visa'

export type CaseStatus = 'Active' | 'Completed' | 'Other'
