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

// User Management Types
export interface User {
  id: number
  email: string
  name: string
  position: string
  role: UserRole
  isActive: boolean
  mustChangePassword: boolean
  lastLogin?: Date | string
  createdAt: Date | string
  updatedAt: Date | string
  
  // Profile Information
  address?: string
  country?: string
  personalPhone?: string
  emergencyPhone?: string
  emergencyContactName?: string
  profilePhoto?: string
}

export type UserRole = 'ADMIN' | 'AGENT'

export interface CreateUserData {
  email: string
  name: string
  position: string
  role?: UserRole
}

// HR Module Types
export interface PermissionRequest {
  id: number
  userId: number
  requestType: PermissionType
  startDate: Date | string
  endDate: Date | string
  reason: string
  status: RequestStatus
  approvedBy?: number
  approvedAt?: Date | string
  rejectedReason?: string
  createdAt: Date | string
  updatedAt: Date | string
  user?: User
  approver?: User
}

export type PermissionType = 
  | 'VACATION'
  | 'SICK_LEAVE' 
  | 'PERSONAL_LEAVE'
  | 'MATERNITY_LEAVE'
  | 'PATERNITY_LEAVE'
  | 'PTO'
  | 'OTHER'

export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface IncidentReport {
  id: number
  userId: number
  title: string
  description: string
  incidentType: IncidentType
  priority: Priority
  imageUrl?: string
  status: IncidentStatus
  createdAt: Date | string
  updatedAt: Date | string
  user?: User
}

export type IncidentType = 
  | 'TECHNICAL'
  | 'WORKPLACE'
  | 'HARASSMENT'
  | 'SAFETY'
  | 'EQUIPMENT'
  | 'OTHER'

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export type IncidentStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'

// Training Module Types
export interface TrainingModule {
  id: number
  title: string
  description?: string
  category: TrainingCategory
  content: string
  isActive: boolean
  order: number
  createdAt: Date | string
  updatedAt: Date | string
}

export type TrainingCategory = 
  | 'VISAS'
  | 'IMMIGRATION_LAW'
  | 'CUSTOMER_SERVICE'
  | 'TECHNOLOGY'
  | 'COMPLIANCE'
  | 'SAFETY'
  | 'OTHER'

// Auth Types
export interface LoginData {
  email: string
  password: string
}

export interface AuthUser {
  id: number
  email: string
  name: string
  position: string
  role: UserRole
  mustChangePassword: boolean
  
  // Profile Information
  address?: string
  country?: string
  personalPhone?: string
  emergencyPhone?: string
  emergencyContactName?: string
  profilePhoto?: string
}

export interface PasswordChangeData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

// News Management Types
export interface News {
  id: number
  title: string
  content: string
  imageUrl?: string
  isActive: boolean
  createdAt: Date | string
  updatedAt: Date | string
  authorId: number
  author: {
    id: number
    name: string
    email: string
  }
}
