import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const authUser = await verifyAuth(request)
    
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    return NextResponse.json({ 
      success: true, 
      user: authUser 
    })
  } catch (error) {
    console.error('Get current user error:', error)
    return NextResponse.json({ success: false, error: 'Failed to get user info' }, { status: 500 })
  }
}
