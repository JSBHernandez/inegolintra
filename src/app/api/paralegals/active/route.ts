import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'

// GET - Get active paralegals for dropdown
export async function GET(request: NextRequest) {
  try {
    const authUser = await verifyAuth(request)
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Temporary SQL query until Prisma client is properly updated
    const activeParalegals = await db.$queryRaw`
      SELECT name FROM paralegals WHERE isActive = 1 ORDER BY name ASC
    ` as { name: string }[]

    const paralegalNames = activeParalegals.map((p: { name: string }) => p.name)

    return NextResponse.json({ 
      success: true, 
      data: paralegalNames 
    })

  } catch (error) {
    console.error('Active paralegals fetch error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}