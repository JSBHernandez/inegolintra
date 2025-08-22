import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'
import { trainingModuleSchema } from '@/lib/validations'

export async function GET(request: NextRequest) {
  try {
    const authUser = await verifyAuth(request)
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    let whereClause: any = { isActive: true }
    
    if (category) {
      whereClause.category = category
    }

    const trainingModules = await db.trainingModule.findMany({
      where: whereClause,
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json({ success: true, data: trainingModules })
  } catch (error) {
    console.error('Get training modules error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch training modules' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await verifyAuth(request)
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = trainingModuleSchema.parse(body)

    const newModule = await db.trainingModule.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        category: validatedData.category,
        content: validatedData.content,
        isActive: validatedData.isActive,
        order: validatedData.order,
      }
    })

    return NextResponse.json({ success: true, data: newModule }, { status: 201 })
  } catch (error) {
    console.error('Create training module error:', error)
    if (error instanceof Error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: 'Failed to create training module' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authUser = await verifyAuth(request)
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updateData } = body
    
    if (!id) {
      return NextResponse.json({ success: false, error: 'Module ID is required' }, { status: 400 })
    }

    const validatedData = trainingModuleSchema.parse(updateData)

    const updatedModule = await db.trainingModule.update({
      where: { id: parseInt(id) },
      data: validatedData
    })

    return NextResponse.json({ success: true, data: updatedModule })
  } catch (error) {
    console.error('Update training module error:', error)
    if (error instanceof Error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: 'Failed to update training module' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authUser = await verifyAuth(request)
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ success: false, error: 'Module ID is required' }, { status: 400 })
    }

    await db.trainingModule.delete({
      where: { id: parseInt(id) }
    })

    return NextResponse.json({ success: true, message: 'Training module deleted successfully' })
  } catch (error) {
    console.error('Delete training module error:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete training module' }, { status: 500 })
  }
}
