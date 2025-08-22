import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { db } from './db'
import { AuthUser } from '@/types'

export async function verifyAuth(request: NextRequest): Promise<AuthUser | null> {
  const token = request.cookies.get('auth-token')?.value

  if (!token) {
    return null
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || '946038027d28fc4a98149a55e26a3da61ee6d5c1cd9a2db409a71080afcac49753c9ab8d7d125b771124b93501706c5938efa2e36b2eaf7f5000e159f1807d95'
    const decoded = jwt.verify(token, jwtSecret) as any
    
    // Get user from database to ensure they still exist and are active
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        position: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
      }
    })

    if (!user || !user.isActive) {
      return null
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      position: user.position,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    }
  } catch {
    return null
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateRandomPassword(length: number = 16): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?'
  let password = ''
  
  // Ensure at least one character from each required category
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?'
  
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += symbols[Math.floor(Math.random() * symbols.length)]
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)]
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

export function createToken(user: AuthUser): string {
  const jwtSecret = process.env.JWT_SECRET || '946038027d28fc4a98149a55e26a3da61ee6d5c1cd9a2db409a71080afcac49753c9ab8d7d125b771124b93501706c5938efa2e36b2eaf7f5000e159f1807d95'
  
  return jwt.sign(
    { 
      userId: user.id,
      email: user.email,
      role: user.role
    },
    jwtSecret,
    { expiresIn: '24h' }
  )
}

// Legacy function for backward compatibility with admin login
export function verifyLegacyAuth(request: NextRequest): boolean {
  const token = request.cookies.get('auth-token')?.value

  if (!token) {
    return false
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || '946038027d28fc4a98149a55e26a3da61ee6d5c1cd9a2db409a71080afcac49753c9ab8d7d125b771124b93501706c5938efa2e36b2eaf7f5000e159f1807d95'
    const decoded = jwt.verify(token, jwtSecret) as any
    
    // Check if it's the legacy admin token
    return decoded.username === 'admin' && decoded.role === 'admin'
  } catch {
    return false
  }
}
