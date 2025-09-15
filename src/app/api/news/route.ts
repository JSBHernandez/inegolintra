import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'
import { createNewsSchema, updateNewsSchema } from '@/lib/validations'

// GET - Get all news (active only for non-admins, all for admins)
export async function GET(request: NextRequest) {
  try {
    const authUser = await verifyAuth(request)
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'

    // Only admins can see inactive news
    const showInactive = authUser.role === 'ADMIN' && includeInactive

    const news = await db.news.findMany({
      where: showInactive ? {} : { isActive: true },
      include: {
        author: {
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
      data: news 
    })

  } catch (error) {
    console.error('News fetch error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// POST - Create new news (admin only)
export async function POST(request: NextRequest) {
  try {
    const authUser = await verifyAuth(request)
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createNewsSchema.parse(body)

    const news = await db.news.create({
      data: {
        title: validatedData.title,
        content: validatedData.content,
        imageUrl: validatedData.imageUrl || null,
        authorId: authUser.id,
      },
      include: {
        author: {
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
      message: 'News created successfully',
      data: news
    })

  } catch (error) {
    console.error('News creation error:', error)
    
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

// PUT - Update news (admin only)
export async function PUT(request: NextRequest) {
  try {
    const authUser = await verifyAuth(request)
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { id, ...updateData } = body
    
    if (!id) {
      return NextResponse.json({ success: false, error: 'News ID is required' }, { status: 400 })
    }

    const validatedData = updateNewsSchema.parse(updateData)

    // Check if news exists
    const existingNews = await db.news.findUnique({
      where: { id: parseInt(id) }
    })

    if (!existingNews) {
      return NextResponse.json({ success: false, error: 'News not found' }, { status: 404 })
    }

    const updatedNews = await db.news.update({
      where: { id: parseInt(id) },
      data: {
        ...(validatedData.title && { title: validatedData.title }),
        ...(validatedData.content && { content: validatedData.content }),
        ...(validatedData.imageUrl !== undefined && { imageUrl: validatedData.imageUrl || null }),
        ...(validatedData.isActive !== undefined && { isActive: validatedData.isActive }),
      },
      include: {
        author: {
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
      message: 'News updated successfully',
      data: updatedNews
    })

  } catch (error) {
    console.error('News update error:', error)
    
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

// DELETE - Delete news (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const authUser = await verifyAuth(request)
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ success: false, error: 'News ID is required' }, { status: 400 })
    }

    // Check if news exists
    const existingNews = await db.news.findUnique({
      where: { id: parseInt(id) }
    })

    if (!existingNews) {
      return NextResponse.json({ success: false, error: 'News not found' }, { status: 404 })
    }

    await db.news.delete({
      where: { id: parseInt(id) }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'News deleted successfully'
    })

  } catch (error) {
    console.error('News deletion error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}