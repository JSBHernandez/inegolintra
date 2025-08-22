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
  paralegal: z.union([
    z.string().refine(val => paralegalOptions.includes(val as typeof paralegalOptions[number]), {
      message: 'Invalid paralegal selection'
    }),
    z.literal(''),
    z.undefined()
  ]).optional(),
})

export type ClientCaseFormData = z.infer<typeof clientCaseSchema>
