import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { db } from '@/lib/db'
import { verifyPassword, createToken } from '@/lib/auth'
import { loginSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = loginSchema.parse(body)

    // Check for legacy admin login first
    const adminUsername = process.env.ADMIN_USERNAME || 'admin'
    const adminPassword = process.env.ADMIN_PASSWORD || 'A8mL9xK3pQ7w'
    const jwtSecret = process.env.JWT_SECRET || '946038027d28fc4a98149a55e26a3da61ee6d5c1cd9a2db409a71080afcac49753c9ab8d7d125b771124b93501706c5938efa2e36b2eaf7f5000e159f1807d95'

    // Legacy admin login (for backward compatibility)
    if (email === adminUsername && password === adminPassword) {
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

    // Regular user login
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true,
        position: true,
        role: true,
        password: true,
        isActive: true,
        mustChangePassword: true,
      }
    })

    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const isPasswordValid = await verifyPassword(password, user.password)
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Update last login
    await db.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    })

    const authUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      position: user.position,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    }

    const token = createToken(authUser)

    const response = NextResponse.json(
      { 
        success: true, 
        message: 'Login successful',
        user: authUser,
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
