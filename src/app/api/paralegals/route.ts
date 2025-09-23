import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'

// GET - Get all paralegals
export async function GET(request: NextRequest) {
  try {
    const authUser = await verifyAuth(request)
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Temporary SQL query until Prisma client is properly updated
    const paralegals = await db.$queryRaw`
      SELECT id, name, isActive, createdAt, updatedAt 
      FROM paralegals 
      ORDER BY isActive DESC, name ASC
    ` as { id: number; name: string; isActive: boolean; createdAt: Date; updatedAt: Date }[]

    return NextResponse.json({ 
      success: true, 
      data: paralegals 
    })

  } catch (error) {
    console.error('Paralegals fetch error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// POST - Create new paralegal
export async function POST(request: NextRequest) {
  try {
    const authUser = await verifyAuth(request)
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Paralegal name is required' 
      }, { status: 400 })
    }

    // Check if paralegal already exists (case insensitive)
    const existingCheck = await db.$queryRaw`
      SELECT id FROM paralegals WHERE LOWER(name) = LOWER(${name.trim()})
    ` as { id: number }[]

    if (existingCheck.length > 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'A paralegal with this name already exists' 
      }, { status: 400 })
    }

    const result = await db.$queryRaw`
      INSERT INTO paralegals (name, isActive, createdAt, updatedAt) 
      VALUES (${name.trim()}, 1, NOW(), NOW())
    `

    // Get the created paralegal
    const newParalegal = await db.$queryRaw`
      SELECT id, name, isActive, createdAt, updatedAt 
      FROM paralegals 
      WHERE name = ${name.trim()}
    ` as { id: number; name: string; isActive: boolean; createdAt: Date; updatedAt: Date }[]

    return NextResponse.json({ 
      success: true, 
      data: newParalegal[0],
      message: 'Paralegal created successfully' 
    })

  } catch (error) {
    console.error('Paralegal creation error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// PUT - Update paralegal (toggle active status)
export async function PUT(request: NextRequest) {
  try {
    const authUser = await verifyAuth(request)
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, isActive } = body

    if (!id || typeof isActive !== 'boolean') {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid request data' 
      }, { status: 400 })
    }

    const result = await db.$queryRaw`
      UPDATE paralegals 
      SET isActive = ${isActive}, updatedAt = NOW() 
      WHERE id = ${parseInt(id)}
    `

    // Get the updated paralegal
    const updatedParalegal = await db.$queryRaw`
      SELECT id, name, isActive, createdAt, updatedAt 
      FROM paralegals 
      WHERE id = ${parseInt(id)}
    ` as { id: number; name: string; isActive: boolean; createdAt: Date; updatedAt: Date }[]

    return NextResponse.json({ 
      success: true, 
      data: updatedParalegal[0],
      message: `Paralegal ${isActive ? 'activated' : 'deactivated'} successfully` 
    })

  } catch (error) {
    console.error('Paralegal update error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}