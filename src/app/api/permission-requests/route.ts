import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'
import { permissionRequestSchema } from '@/lib/validations'
import { emailService } from '@/lib/email'

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
      // Admin can see all requests or filter by userId
      if (userId) {
        whereClause = { userId: parseInt(userId) }
      }
    } else {
      // Agents can only see their own requests
      whereClause = { userId: authUser.id }
    }

    const permissionRequests = await db.permissionRequest.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            position: true,
          }
        },
        approver: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ success: true, data: permissionRequests })
  } catch (error) {
    console.error('Get permission requests error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch permission requests' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await verifyAuth(request)
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = permissionRequestSchema.parse(body)

    const newRequest = await db.permissionRequest.create({
      data: {
        userId: authUser.id,
        requestType: validatedData.requestType,
        startDate: new Date(validatedData.startDate),
        endDate: new Date(validatedData.endDate),
        reason: validatedData.reason,
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

    return NextResponse.json({ success: true, data: newRequest }, { status: 201 })
  } catch (error) {
    console.error('Create permission request error:', error)
    if (error instanceof Error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: 'Failed to create permission request' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authUser = await verifyAuth(request)
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, status, rejectedReason } = body
    
    if (!id || !status) {
      return NextResponse.json({ success: false, error: 'Request ID and status are required' }, { status: 400 })
    }

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 })
    }

    const updateData: {
      status: 'APPROVED' | 'REJECTED'
      approvedBy: number
      approvedAt: Date
      rejectedReason?: string
    } = {
      status: status as 'APPROVED' | 'REJECTED',
      approvedBy: authUser.id,
      approvedAt: new Date(),
    }

    if (status === 'REJECTED' && rejectedReason) {
      updateData.rejectedReason = rejectedReason
    }

    const updatedRequest = await db.permissionRequest.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            position: true,
          }
        },
        approver: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    })

    // Send email notification to the agent
    console.log('🚀 Attempting to send permission decision email...')
    console.log('- User email:', updatedRequest.user.email)
    console.log('- User name:', updatedRequest.user.name)
    console.log('- Request type:', updatedRequest.requestType)
    console.log('- Decision:', status)
    console.log('- Admin note:', rejectedReason || 'None')
    
    try {
      const emailSent = await emailService.sendPermissionDecisionEmail(
        updatedRequest.user.email,
        updatedRequest.user.name,
        updatedRequest.requestType,
        status as 'APPROVED' | 'REJECTED',
        updatedRequest.startDate.toISOString(),
        updatedRequest.endDate.toISOString(),
        updatedRequest.reason,
        rejectedReason || undefined
      )
      
      if (emailSent) {
        console.log(`✅ Permission decision email sent successfully to ${updatedRequest.user.email}`)
      } else {
        console.log(`❌ Failed to send permission decision email to ${updatedRequest.user.email}`)
      }
    } catch (emailError) {
      console.error('❌ Error sending permission decision email:', emailError)
      console.error('Email error details:', {
        name: emailError instanceof Error ? emailError.name : 'Unknown',
        message: emailError instanceof Error ? emailError.message : 'Unknown error',
        stack: emailError instanceof Error ? emailError.stack : 'No stack trace'
      })
      // Don't fail the request if email sending fails
    }

    return NextResponse.json({ success: true, data: updatedRequest })
  } catch (error) {
    console.error('Update permission request error:', error)
    if (error instanceof Error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: 'Failed to update permission request' }, { status: 500 })
  }
}
