import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface TrainingModuleRow {
  id: number
  title: string
  description: string | null
  category: string | null
  content: string | null
  isActive: boolean
  order: number
  createdAt: Date
  updatedAt: Date
}

// GET single training module
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const moduleId = parseInt(id)

    if (isNaN(moduleId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid module ID' },
        { status: 400 }
      )
    }

    const modules = await db.$queryRaw<TrainingModuleRow[]>`
      SELECT id, title, description, category, content, isActive, \`order\`,
             CASE 
               WHEN createdAt = '0000-00-00 00:00:00' THEN NOW()
               ELSE createdAt 
             END as createdAt,
             CASE 
               WHEN updatedAt = '0000-00-00 00:00:00' THEN createdAt
               ELSE updatedAt 
             END as updatedAt
      FROM training_modules 
      WHERE id = ${moduleId}
    `

    if (modules.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Module not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: modules[0]
    })

  } catch (error) {
    console.error('Error fetching training module:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch training module' },
      { status: 500 }
    )
  }
}

// PUT (update) training module
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const moduleId = parseInt(id)

    if (isNaN(moduleId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid module ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { title, description, category, content, isActive, order } = body

    console.log('UPDATE - Received data for module', moduleId, ':', { title, description, category, content, isActive, order })

    if (!title || title.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      )
    }

    // Check if module exists
    const existingModules = await db.$queryRaw<{ id: number }[]>`
      SELECT id FROM training_modules WHERE id = ${moduleId}
    `

    if (existingModules.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Module not found' },
        { status: 404 }
      )
    }

    // Process values properly
    const categoryValue = category && category.trim() !== '' ? category.trim() : null
    const descriptionValue = description && description.trim() !== '' ? description.trim() : null
    const contentValue = content && content.trim() !== '' ? content.trim() : null

    console.log('UPDATE - Processed values for module', moduleId, ':', { 
      title: title.trim(), 
      categoryValue, 
      descriptionValue, 
      contentValue,
      isActive: isActive !== false ? 1 : 0,
      order: order || 0
    })

    // Update the module
    const updateResult = await db.$executeRaw`
      UPDATE training_modules 
      SET title = ${title.trim()}, 
          description = ${descriptionValue}, 
          category = ${categoryValue}, 
          content = ${contentValue}, 
          isActive = ${isActive !== false ? 1 : 0}, 
          \`order\` = ${order || 0}, 
          updatedAt = NOW()
      WHERE id = ${moduleId}
    `

    console.log('UPDATE - SQL execution result:', updateResult)

    // Verify the update with a quick query
    const verifyUpdate = await db.$queryRaw<TrainingModuleRow[]>`
      SELECT id, title, category, description FROM training_modules WHERE id = ${moduleId}
    `
    console.log('UPDATE - Verification query result:', verifyUpdate[0])

    // Get the updated module
    const updatedModules = await db.$queryRaw<TrainingModuleRow[]>`
      SELECT id, title, description, category, content, isActive, \`order\`,
             CASE 
               WHEN createdAt = '0000-00-00 00:00:00' THEN NOW()
               ELSE createdAt 
             END as createdAt,
             CASE 
               WHEN updatedAt = '0000-00-00 00:00:00' THEN createdAt
               ELSE updatedAt 
             END as updatedAt
      FROM training_modules 
      WHERE id = ${moduleId}
    `

    return NextResponse.json({
      success: true,
      message: 'Training module updated successfully',
      data: updatedModules[0]
    })

  } catch (error) {
    console.error('Error updating training module:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update training module' },
      { status: 500 }
    )
  }
}

// DELETE training module
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const moduleId = parseInt(id)

    if (isNaN(moduleId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid module ID' },
        { status: 400 }
      )
    }

    // Check if module exists
    const existingModules = await db.$queryRaw<{ id: number }[]>`
      SELECT id FROM training_modules WHERE id = ${moduleId}
    `

    if (existingModules.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Module not found' },
        { status: 404 }
      )
    }

    // Delete related content first (if any)
    await db.$executeRaw`DELETE FROM training_module_content WHERE moduleId = ${moduleId}`

    // Delete the module
    await db.$executeRaw`DELETE FROM training_modules WHERE id = ${moduleId}`

    return NextResponse.json({
      success: true,
      message: 'Training module deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting training module:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete training module' },
      { status: 500 }
    )
  }
}