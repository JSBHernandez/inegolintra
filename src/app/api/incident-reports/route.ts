import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'
import { incidentReportSchema } from '@/lib/validations'

export async function GET(request: NextRequest) {
  try {
    const authUser = await verifyAuth(request)
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    let whereClause = {}
    
    if (authUser.role === 'ADMIN') {
      // Admin can see all reports or filter by userId
      if (userId) {
        whereClause = { userId: parseInt(userId) }
      }
    } else {
      // Agents can only see their own reports
      whereClause = { userId: authUser.id }
    }

    const incidentReports = await db.incidentReport.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            position: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ success: true, data: incidentReports })
  } catch (error) {
    console.error('Get incident reports error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch incident reports' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await verifyAuth(request)
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = incidentReportSchema.parse(body)

    const newReport = await db.incidentReport.create({
      data: {
        userId: authUser.id,
        title: validatedData.title,
        description: validatedData.description,
        incidentType: validatedData.incidentType,
        priority: validatedData.priority || 'MEDIUM',
        imageUrl: validatedData.imageUrl || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            position: true,
          }
        }
      }
    })

    // TODO: Send email notification to admin
    console.log(`New incident report from ${authUser.name}: ${validatedData.title}`)

    return NextResponse.json({ success: true, data: newReport }, { status: 201 })
  } catch (error) {
    console.error('Create incident report error:', error)
    if (error instanceof Error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: 'Failed to create incident report' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authUser = await verifyAuth(request)
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, status } = body
    
    if (!id || !status) {
      return NextResponse.json({ success: false, error: 'Report ID and status are required' }, { status: 400 })
    }

    if (!['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 })
    }

    const updatedReport = await db.incidentReport.update({
      where: { id: parseInt(id) },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            position: true,
          }
        }
      }
    })

    return NextResponse.json({ success: true, data: updatedReport })
  } catch (error) {
    console.error('Update incident report error:', error)
    if (error instanceof Error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: 'Failed to update incident report' }, { status: 500 })
  }
}
