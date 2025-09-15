import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'
import { uploadUserFileSchema } from '@/lib/validations'

// GET - Get user files
export async function GET(request: NextRequest) {
  try {
    const authUser = await verifyAuth(request)
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    // If userId is provided and user is not admin, only allow access to own files
    if (userId && authUser.role !== 'ADMIN' && parseInt(userId) !== authUser.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    // For admins: get files for specific user or all users
    // For regular users: get only their own files
    const whereClause = authUser.role === 'ADMIN' 
      ? (userId ? { userId: parseInt(userId) } : {})
      : { userId: authUser.id }

    const files = await db.userFile.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ 
      success: true, 
      data: files 
    })

  } catch (error) {
    console.error('User files fetch error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// POST - Upload new file
export async function POST(request: NextRequest) {
  try {
    const authUser = await verifyAuth(request)
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = uploadUserFileSchema.parse(body)

    // Determine target user ID
    const targetUserId = validatedData.userId || authUser.id

    // If uploading for someone else, must be admin
    if (targetUserId !== authUser.id && authUser.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Verify target user exists
    const targetUser = await db.user.findUnique({
      where: { id: targetUserId }
    })

    if (!targetUser) {
      return NextResponse.json({ success: false, error: 'Target user not found' }, { status: 404 })
    }

    const file = await db.userFile.create({
      data: {
        fileName: validatedData.fileName,
        fileUrl: validatedData.fileUrl,
        fileType: validatedData.fileType,
        fileSize: validatedData.fileSize,
        description: validatedData.description,
        userId: targetUserId,
        uploadedById: authUser.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'File uploaded successfully',
      data: file
    })

  } catch (error) {
    console.error('File upload error:', error)
    
    if (error && typeof error === 'object' && 'issues' in error) {
      // Zod validation error
      const zodError = error as { issues: Array<{ message: string; path: string[] }> }
      const errorMessage = zodError.issues.map(issue => issue.message).join(', ')
      return NextResponse.json({ 
        success: false, 
        error: errorMessage 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// DELETE - Delete file
export async function DELETE(request: NextRequest) {
  try {
    const authUser = await verifyAuth(request)
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('id')
    
    if (!fileId) {
      return NextResponse.json({ success: false, error: 'File ID is required' }, { status: 400 })
    }

    // Check if file exists
    const existingFile = await db.userFile.findUnique({
      where: { id: parseInt(fileId) }
    })

    if (!existingFile) {
      return NextResponse.json({ success: false, error: 'File not found' }, { status: 404 })
    }

    // Check permissions: owner can delete their files, admin can delete any file
    if (existingFile.userId !== authUser.id && authUser.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    await db.userFile.delete({
      where: { id: parseInt(fileId) }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'File deleted successfully'
    })

  } catch (error) {
    console.error('File deletion error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}