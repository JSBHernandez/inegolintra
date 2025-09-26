import { z } from 'zod'

export const paralegalOptions = [
  'Tania Estrada',
  'Katherine Pineda', 
  'Maria Jovanovic',
  'Herminio Garza'
] as const

export const clientCaseSchema = z.object({
  clientName: z.string().min(1, 'Client name is required').max(255, 'Client name is too long'),
  caseType: z.string().min(1, 'Case type is required').max(100, 'Case type is too long'),
  status: z.enum(['Active', 'Completed']),
  notes: z.string().optional(),
  totalContract: z.number().positive('Total contract must be a positive number').optional(),
  paralegal: z.string().max(100, 'Paralegal name is too long').optional().or(z.literal('')),
})

export type ClientCaseFormData = z.infer<typeof clientCaseSchema>

// User Management Validations
export const createUserSchema = z.object({
  email: z.string().email('Invalid email address').max(255, 'Email is too long'),
  name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
  position: z.string().min(1, 'Position is required').max(100, 'Position is too long'),
  role: z.enum(['ADMIN', 'AGENT']),
})

export const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
  position: z.string().min(1, 'Position is required').max(100, 'Position is too long'),
  role: z.enum(['ADMIN', 'AGENT']),
  isActive: z.boolean(),
})

export const updateProfileSchema = z.object({
  address: z.string().max(500, 'Address is too long').optional().or(z.literal('')),
  country: z.string().max(100, 'Country name is too long').optional().or(z.literal('')),
  personalPhone: z.string().max(20, 'Phone number is too long').optional().or(z.literal('')),
  emergencyPhone: z.string().max(20, 'Emergency phone is too long').optional().or(z.literal('')),
  emergencyContactName: z.string().max(255, 'Emergency contact name is too long').optional().or(z.literal('')),
  profilePhoto: z.string().refine(
    (val) => val === '' || val.startsWith('http://') || val.startsWith('https://') || val.startsWith('data:') || val.startsWith('/api/files/'),
    'Invalid photo URL or data format'
  ).optional().or(z.literal('')),
})

// Combined schema for complete profile update (basic + additional info)
export const updateCompleteProfileSchema = z.object({
  // Basic information
  name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
  position: z.string().min(1, 'Position is required').max(100, 'Position is too long'),
  // Additional information
  address: z.string().max(500, 'Address is too long').optional().or(z.literal('')),
  country: z.string().max(100, 'Country name is too long').optional().or(z.literal('')),
  personalPhone: z.string().max(20, 'Phone number is too long').optional().or(z.literal('')),
  emergencyPhone: z.string().max(20, 'Emergency phone is too long').optional().or(z.literal('')),
  emergencyContactName: z.string().max(255, 'Emergency contact name is too long').optional().or(z.literal('')),
  profilePhoto: z.string().refine(
    (val) => val === '' || val.startsWith('http://') || val.startsWith('https://') || val.startsWith('data:') || val.startsWith('/api/files/'),
    'Invalid photo URL or data format'
  ).optional().or(z.literal('')),
})

export const loginSchema = z.object({
  username: z.string().min(1, 'Username/Email is required').optional(),
  email: z.string().min(1, 'Username/Email is required').optional(),
  password: z.string().min(1, 'Password is required'),
}).refine(data => data.username || data.email, {
  message: "Either username or email is required",
  path: ["username"]
})

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(5, 'Password must be at least 5 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

// HR Module Validations
export const permissionRequestSchema = z.object({
  requestType: z.enum(['VACATION', 'SICK_LEAVE', 'PERSONAL_LEAVE', 'MATERNITY_LEAVE', 'PATERNITY_LEAVE', 'PTO', 'OTHER']),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  reason: z.string().min(10, 'Please provide a detailed reason (minimum 10 characters)').max(1000, 'Reason is too long'),
}).refine((data) => {
  const start = new Date(data.startDate)
  const end = new Date(data.endDate)
  return start <= end
}, {
  message: "End date must be after start date",
  path: ["endDate"],
}).refine((data) => {
  const start = new Date(data.startDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return start >= today
}, {
  message: "Start date cannot be in the past",
  path: ["startDate"],
})

export const incidentReportSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title is too long'),
  description: z.string().min(10, 'Please provide a detailed description (minimum 10 characters)').max(2000, 'Description is too long'),
  incidentType: z.enum(['TECHNICAL', 'WORKPLACE', 'HARASSMENT', 'SAFETY', 'EQUIPMENT', 'OTHER']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  imageUrl: z.string().url('Invalid image URL').optional().or(z.literal('')),
})

// Training Module Validations
export const trainingModuleSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title is too long'),
  description: z.string().max(500, 'Description is too long').optional().nullable(),
  category: z.string().max(100, 'Category is too long').optional().nullable(),
  content: z.string().max(10000, 'Content is too long').optional().nullable(),
  isActive: z.boolean(),
  order: z.number().int().min(0),
})

export const trainingModuleContentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title is too long'),
  description: z.string().max(1000, 'Description is too long').optional(),
  contentType: z.enum(['VIDEO', 'DOCUMENT', 'TEXT', 'LINK', 'YOUTUBE']),
  url: z.string().optional(),
  fileData: z.string().optional(), // Base64 data for uploaded files
  fileName: z.string().max(255, 'File name is too long').optional(),
  fileSize: z.number().int().min(0).optional(),
  order: z.number().int().min(0),
  isActive: z.boolean().default(true),
  moduleId: z.number().int(),
}).refine((data) => {
  // For VIDEO and YOUTUBE, validate URL format if provided
  if ((data.contentType === 'VIDEO' || data.contentType === 'YOUTUBE') && data.url) {
    try {
      new URL(data.url);
      return true;
    } catch {
      return false;
    }
  }
  
  // For DOCUMENT, allow both URLs and relative paths (uploaded files)
  if (data.contentType === 'DOCUMENT' && data.url) {
    // Allow full URLs or relative paths (like /uploads/file.pdf)
    if (data.url.startsWith('http://') || data.url.startsWith('https://') || data.url.startsWith('/')) {
      return true;
    }
    try {
      new URL(data.url);
      return true;
    } catch {
      return false;
    }
  }
  
  // For LINK, validate URL format
  if (data.contentType === 'LINK' && data.url) {
    try {
      new URL(data.url);
      return true;
    } catch {
      return false;
    }
  }
  
  // Either URL or fileData should be provided for most content types
  if (data.contentType === 'TEXT') {
    return data.url !== undefined // For TEXT, url field contains the text content
  }
  return data.url || data.fileData
}, {
  message: "Content is required for this content type",
  path: ["url"],
})

// News Validations
export const createNewsSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title is too long'),
  content: z.string().min(10, 'Content must be at least 10 characters').max(5000, 'Content is too long'),
  imageUrl: z.string().refine(
    (val) => val === '' || val.startsWith('http://') || val.startsWith('https://') || val.startsWith('data:'),
    'Invalid image URL or data format'
  ).optional().or(z.literal('')),
})

export const updateNewsSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title is too long').optional(),
  content: z.string().min(10, 'Content must be at least 10 characters').max(5000, 'Content is too long').optional(),
  imageUrl: z.string().refine(
    (val) => val === '' || val.startsWith('http://') || val.startsWith('https://') || val.startsWith('data:'),
    'Invalid image URL or data format'
  ).optional().or(z.literal('')),
  isActive: z.boolean().optional(),
})

// User Files Validations
export const uploadUserFileSchema = z.object({
  fileName: z.string().min(1, 'File name is required').max(255, 'File name is too long'),
  fileUrl: z.string().url('Invalid file URL'),
  fileType: z.string().min(1, 'File type is required'),
  fileSize: z.number().int().min(1, 'File size must be greater than 0'),
  description: z.string().max(500, 'Description is too long').optional(),
  userId: z.number().int().min(1, 'User ID is required').optional(), // Optional for admin uploads
})

// Schema for the upload form (before file is uploaded)
export const uploadUserFileFormSchema = z.object({
  fileName: z.string().min(1, 'File name is required').max(255, 'File name is too long'),
  fileUrl: z.string().optional(), // Optional for form validation
  fileType: z.string().min(1, 'File type is required'),
  fileSize: z.number().int().min(1, 'File size must be greater than 0'),
  description: z.string().max(500, 'Description is too long').optional(),
})

// Constants for dropdowns
export const permissionTypeOptions = [
  { value: 'VACATION', label: 'Vacation' },
  { value: 'SICK_LEAVE', label: 'Sick Leave' },
  { value: 'PERSONAL_LEAVE', label: 'Personal Leave' },
  { value: 'MATERNITY_LEAVE', label: 'Maternity Leave' },
  { value: 'PATERNITY_LEAVE', label: 'Paternity Leave' },
  { value: 'PTO', label: 'PTO (Paid Time Off)' },
  { value: 'OTHER', label: 'Other' },
] as const

export const incidentTypeOptions = [
  { value: 'TECHNICAL', label: 'Technical Issue' },
  { value: 'WORKPLACE', label: 'Workplace Issue' },
  { value: 'HARASSMENT', label: 'Harassment' },
  { value: 'SAFETY', label: 'Safety Concern' },
  { value: 'EQUIPMENT', label: 'Equipment Problem' },
  { value: 'OTHER', label: 'Other' },
] as const

export const priorityOptions = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
] as const

export const trainingCategoryOptions = [
  { value: 'VISAS', label: 'Visas' },
  { value: 'IMMIGRATION_LAW', label: 'Immigration Law' },
  { value: 'CUSTOMER_SERVICE', label: 'Customer Service' },
  { value: 'TECHNOLOGY', label: 'Technology' },
  { value: 'COMPLIANCE', label: 'Compliance' },
  { value: 'SAFETY', label: 'Safety' },
  { value: 'OTHER', label: 'Other' },
] as const

// Countries list
export const countryOptions = [
  'United States',
  'Canada',
  'Mexico',
  'United Kingdom',
  'Germany',
  'France',
  'Spain',
  'Italy',
  'Japan',
  'South Korea',
  'China',
  'India',
  'Brazil',
  'Argentina',
  'Colombia',
  'Venezuela',
  'Ecuador',
  'Peru',
  'Chile',
  'Australia',
  'New Zealand',
  'Other'
] as const

export type CreateUserFormData = z.infer<typeof createUserSchema>
export type UpdateUserFormData = z.infer<typeof updateUserSchema>
export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>
export type UpdateCompleteProfileFormData = z.infer<typeof updateCompleteProfileSchema>
export type LoginFormData = z.infer<typeof loginSchema>
export type PermissionRequestFormData = z.infer<typeof permissionRequestSchema>
export type IncidentReportFormData = z.infer<typeof incidentReportSchema>
export type TrainingModuleFormData = z.infer<typeof trainingModuleSchema>
export type TrainingModuleContentFormData = z.infer<typeof trainingModuleContentSchema>
export type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>
export type CreateNewsFormData = z.infer<typeof createNewsSchema>
export type UpdateNewsFormData = z.infer<typeof updateNewsSchema>
export type UploadUserFileFormData = z.infer<typeof uploadUserFileFormSchema>
