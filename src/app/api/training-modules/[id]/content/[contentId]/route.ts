import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; contentId: string }> }
) {
  try {
    const resolvedParams = await params
    const moduleId = parseInt(resolvedParams.id)
    const contentId = parseInt(resolvedParams.contentId)

    if (isNaN(moduleId) || isNaN(contentId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid module ID or content ID'
      }, { status: 400 })
    }

    const content = await db.$queryRaw`
      SELECT 
        id, title, description, contentType, url, fileData, fileName, fileSize, 
        \`order\`, isActive, moduleId, createdAt,
        CASE 
          WHEN updatedAt = '0000-00-00 00:00:00' OR updatedAt IS NULL 
          THEN createdAt 
          ELSE updatedAt 
        END as updatedAt
      FROM training_module_content 
      WHERE id = ${contentId} AND moduleId = ${moduleId}
      LIMIT 1
    `

    if (!content || !Array.isArray(content) || content.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Content not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: content[0]
    })

  } catch (error) {
    console.error('Error fetching training module content:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch content'
    }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; contentId: string }> }
) {
  try {
    const resolvedParams = await params
    const moduleId = parseInt(resolvedParams.id)
    const contentId = parseInt(resolvedParams.contentId)

    if (isNaN(moduleId) || isNaN(contentId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid module ID or content ID'
      }, { status: 400 })
    }

    const body = await request.json()
    const {
      title,
      description,
      contentType,
      url,
      fileData,
      fileName,
      fileSize,
      order,
      isActive
    } = body

    // Verify the content belongs to the module
    const existingContent = await db.$queryRaw`
      SELECT id FROM training_module_content 
      WHERE id = ${contentId} AND moduleId = ${moduleId}
      LIMIT 1
    `

    if (!existingContent || !Array.isArray(existingContent) || existingContent.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Content not found'
      }, { status: 404 })
    }

    // Update content
    await db.$executeRaw`
      UPDATE training_module_content 
      SET 
        title = ${title},
        description = ${description || null},
        contentType = ${contentType},
        url = ${url || null},
        fileData = ${fileData || null},
        fileName = ${fileName || null},
        fileSize = ${fileSize || null},
        \`order\` = ${order || 0},
        isActive = ${isActive !== undefined ? isActive : true},
        updatedAt = NOW()
      WHERE id = ${contentId}
    `

    // Fetch updated content
    const updatedContent = await db.$queryRaw`
      SELECT 
        id, title, description, contentType, url, fileData, fileName, fileSize, 
        \`order\`, isActive, moduleId, createdAt,
        CASE 
          WHEN updatedAt = '0000-00-00 00:00:00' OR updatedAt IS NULL 
          THEN createdAt 
          ELSE updatedAt 
        END as updatedAt
      FROM training_module_content 
      WHERE id = ${contentId}
      LIMIT 1
    `

    return NextResponse.json({
      success: true,
      data: Array.isArray(updatedContent) ? updatedContent[0] : updatedContent
    })

  } catch (error) {
    console.error('Error updating training module content:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update content'
    }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; contentId: string }> }
) {
  try {
    const resolvedParams = await params
    const moduleId = parseInt(resolvedParams.id)
    const contentId = parseInt(resolvedParams.contentId)

    if (isNaN(moduleId) || isNaN(contentId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid module ID or content ID'
      }, { status: 400 })
    }

    // Verify the content belongs to the module
    const existingContent = await db.$queryRaw`
      SELECT id FROM training_module_content 
      WHERE id = ${contentId} AND moduleId = ${moduleId}
      LIMIT 1
    `

    if (!existingContent || !Array.isArray(existingContent) || existingContent.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Content not found'
      }, { status: 404 })
    }

    await db.$executeRaw`
      DELETE FROM training_module_content 
      WHERE id = ${contentId}
    `

    return NextResponse.json({
      success: true,
      data: { message: 'Content deleted successfully' }
    })

  } catch (error) {
    console.error('Error deleting training module content:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to delete content'
    }, { status: 500 })
  }
}