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
    const decoded = jwt.verify(token, jwtSecret) as { userId: number; iat: number; exp: number }
    
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
  // Ensure minimum length of 16 characters
  const finalLength = Math.max(length, 16)
  
  // Character sets for different types
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const symbols = '!@#$%^&*()-_=+[]{}|;:,.<>?'
  const allChars = uppercase + lowercase + numbers + symbols
  
  let password = ''
  
  // Ensure at least 2 characters from each category for better security
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += symbols[Math.floor(Math.random() * symbols.length)]
  password += symbols[Math.floor(Math.random() * symbols.length)]
  
  // Fill the remaining characters randomly
  for (let i = 8; i < finalLength; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }
  
  // Shuffle the password multiple times for better randomness
  const passwordArray = password.split('')
  for (let i = passwordArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]]
  }
  
  const finalPassword = passwordArray.join('')
  
  // Debug log to verify password generation
  console.log(`Generated password length: ${finalPassword.length}, Password: ${finalPassword}`)
  
  return finalPassword
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
    const decoded = jwt.verify(token, jwtSecret) as { username: string; role: string; iat: number; exp: number }
    
    // Check if it's the legacy admin token
    return decoded.username === 'admin' && decoded.role === 'admin'
  } catch {
    return false
  }
}
