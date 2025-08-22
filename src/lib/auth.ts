import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

export function verifyAuth(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value

  if (!token) {
    return false
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || '946038027d28fc4a98149a55e26a3da61ee6d5c1cd9a2db409a71080afcac49753c9ab8d7d125b771124b93501706c5938efa2e36b2eaf7f5000e159f1807d95'
    jwt.verify(token, jwtSecret)
    return true
  } catch {
    return false
  }
}
