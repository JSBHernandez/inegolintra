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

    let trainingModules
    if (category) {
      trainingModules = await db.$queryRaw`
        SELECT id, title, description, category, content, isActive, \`order\`, 
               createdAt, 
               CASE 
                 WHEN updatedAt = '0000-00-00 00:00:00' OR updatedAt IS NULL 
                 THEN createdAt 
                 ELSE updatedAt 
               END as updatedAt
        FROM training_modules 
        WHERE isActive = 1 AND category = ${category}
          AND createdAt != '0000-00-00 00:00:00'
        ORDER BY \`order\` ASC, createdAt DESC
      `
    } else {
      trainingModules = await db.$queryRaw`
        SELECT id, title, description, category, content, isActive, \`order\`, 
               createdAt, 
               CASE 
                 WHEN updatedAt = '0000-00-00 00:00:00' OR updatedAt IS NULL 
                 THEN createdAt 
                 ELSE updatedAt 
               END as updatedAt
        FROM training_modules 
        WHERE isActive = 1
          AND createdAt != '0000-00-00 00:00:00'
        ORDER BY \`order\` ASC, createdAt DESC
      `
    }

    const moduleArray = trainingModules as unknown[]
    console.log('Fetched training modules:', moduleArray?.length || 0, 'modules')
    console.log('Sample module data:', moduleArray?.[0] ? { 
      id: (moduleArray[0] as Record<string, unknown>).id, 
      title: (moduleArray[0] as Record<string, unknown>).title, 
      category: (moduleArray[0] as Record<string, unknown>).category 
    } : 'No modules found')

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
    const { title, description, category, content, isActive, order } = body

    // Debug logging
    console.log('Received data:', { title, description, category, content, isActive, order })

    // Basic validation
    if (!title || title.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 })
    }

    // Process category properly - empty string should be null, but non-empty should be preserved
    const categoryValue = category && category.trim() !== '' ? category.trim() : null
    const descriptionValue = description && description.trim() !== '' ? description.trim() : null
    const contentValue = content && content.trim() !== '' ? content.trim() : null

    console.log('Processed values:', { 
      title: title.trim(), 
      categoryValue, 
      descriptionValue, 
      contentValue,
      isActive: isActive !== false ? 1 : 0,
      order: order || 0
    })

    const newModule = await db.$executeRaw`
      INSERT INTO training_modules (title, description, category, content, isActive, \`order\`, createdAt, updatedAt)
      VALUES (${title.trim()}, ${descriptionValue}, ${categoryValue}, ${contentValue}, ${isActive !== false ? 1 : 0}, ${order || 0}, NOW(), NOW())
    `

    console.log('INSERT - SQL execution result:', newModule)

    // Verify the insert with a quick query
    const verifyInsert = await db.$queryRaw`
      SELECT id, title, category, description FROM training_modules ORDER BY id DESC LIMIT 1
    ` as unknown[]
    console.log('INSERT - Verification query result:', (verifyInsert[0] as Record<string, unknown>) || 'No result')

    console.log('Module created successfully')
    return NextResponse.json({ success: true, message: 'Training module created successfully' }, { status: 201 })
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

    const _updatedModule = await db.$executeRaw`
      UPDATE training_modules 
      SET title = ${validatedData.title}, 
          description = ${validatedData.description}, 
          category = ${validatedData.category}, 
          content = ${validatedData.content}, 
          isActive = ${validatedData.isActive}, 
          \`order\` = ${validatedData.order},
          updatedAt = NOW()
      WHERE id = ${parseInt(id)}
    `

    return NextResponse.json({ success: true, message: 'Training module updated successfully' })
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

    await db.$executeRaw`
      DELETE FROM training_modules WHERE id = ${parseInt(id)}
    `

    return NextResponse.json({ success: true, message: 'Training module deleted successfully' })
  } catch (error) {
    console.error('Delete training module error:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete training module' }, { status: 500 })
  }
}
