import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const authUser = await verifyAuth(request)
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Get all users with profile data
    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        address: true,
        country: true,
        personalPhone: true,
        emergencyPhone: true,
        emergencyContactName: true,
        profilePhoto: true,
      }
    })

    console.log('Current users in database with profile data:', users)

    return NextResponse.json({ 
      success: true, 
      data: users,
      message: 'Check server console for detailed user data'
    })

  } catch (error) {
    console.error('Debug users error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}