import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    // Check credentials
    const adminUsername = process.env.ADMIN_USERNAME || 'admin'
    const adminPassword = process.env.ADMIN_PASSWORD || 'A8mL9xK3pQ7w'
    const jwtSecret = process.env.JWT_SECRET || '946038027d28fc4a98149a55e26a3da61ee6d5c1cd9a2db409a71080afcac49753c9ab8d7d125b771124b93501706c5938efa2e36b2eaf7f5000e159f1807d95'

    if (username !== adminUsername || password !== adminPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Create JWT token
    const token = jwt.sign(
      { username: adminUsername, role: 'admin' },
      jwtSecret,
      { expiresIn: '24h' }
    )

    // Create response with token
    const response = NextResponse.json(
      { success: true, message: 'Login successful' },
      { status: 200 }
    )

    // Set HTTP-only cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 86400, // 24 hours
      path: '/',
    })

    return response
  } catch (_) {
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
