import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { loginSchema } from '@/lib/validations'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = loginSchema.parse(body)
    // Allow both email and username for compatibility
    const loginField = validatedData.email || validatedData.username || body.email || ''
    const { password } = validatedData

    // Check for legacy admin login first
    const adminUsername = process.env.ADMIN_USERNAME || 'AdminInegol'
    const adminPassword = process.env.ADMIN_PASSWORD || '#BarbaInegol2025'
    const jwtSecret = process.env.JWT_SECRET || '946038027d28fc4a98149a55e26a3da61ee6d5c1cd9a2db409a71080afcac49753c9ab8d7d125b771124b93501706c5938efa2e36b2eaf7f5000e159f1807d95'

    // Legacy admin login (for backward compatibility)
    if (loginField === adminUsername && password === adminPassword) {
      const token = jwt.sign(
        { username: adminUsername, role: 'admin' },
        jwtSecret,
        { expiresIn: '24h' }
      )

      const response = NextResponse.json(
        { success: true, message: 'Login successful', isLegacyAdmin: true },
        { status: 200 }
      )

      response.cookies.set('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 86400, // 24 hours
        path: '/',
      })

      return response
    }

    // Try database user authentication
    try {
      const user = await db.user.findFirst({
        where: {
          OR: [
            { email: loginField },
            { email: loginField.toLowerCase() }
          ],
          isActive: true
        }
      })

      if (!user) {
        return NextResponse.json(
          { success: false, error: 'Invalid credentials' },
          { status: 401 }
        )
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password)
      if (!isValidPassword) {
        return NextResponse.json(
          { success: false, error: 'Invalid credentials' },
          { status: 401 }
        )
      }

      // Create JWT token
      const token = jwt.sign(
        { userId: user.id },
        jwtSecret,
        { expiresIn: '24h' }
      )

      const response = NextResponse.json(
        { 
          success: true, 
          message: 'Login successful',
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            position: user.position,
            role: user.role
          },
          mustChangePassword: user.mustChangePassword
        },
        { status: 200 }
      )

      response.cookies.set('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 86400, // 24 hours
        path: '/',
      })

      return response

    } catch (dbError) {
      console.error('Database authentication error:', dbError)
      // If database fails, fall back to legacy admin check
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  // Logout endpoint
  const response = NextResponse.json(
    { success: true, message: 'Logout successful' },
    { status: 200 }
  )

  // Clear the auth cookie
  response.cookies.set('auth-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  })

  return response
}
