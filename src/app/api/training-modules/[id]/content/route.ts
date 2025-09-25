import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'
import { trainingModuleContentSchema } from '@/lib/validations'

// Get all content items for a training module
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const authUser = await verifyAuth(request)
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const moduleId = parseInt(resolvedParams.id)
    if (isNaN(moduleId)) {
      return NextResponse.json({ success: false, error: 'Invalid module ID' }, { status: 400 })
    }

    // Check if module exists
    const moduleExists = await db.$queryRaw`
      SELECT id FROM training_modules WHERE id = ${moduleId} LIMIT 1
    `

    if (!moduleExists || !Array.isArray(moduleExists) || moduleExists.length === 0) {
      return NextResponse.json({ success: false, error: 'Module not found' }, { status: 404 })
    }

    // Get content items
    const contentItems = await db.$queryRaw`
      SELECT 
        id, title, description, contentType, url, fileData, fileName, fileSize, 
        \`order\`, isActive, moduleId, 
        createdAt, 
        CASE 
          WHEN updatedAt = '0000-00-00 00:00:00' OR updatedAt IS NULL 
          THEN createdAt 
          ELSE updatedAt 
        END as updatedAt
      FROM training_module_content 
      WHERE moduleId = ${moduleId}
        AND createdAt != '0000-00-00 00:00:00'
      ORDER BY \`order\` ASC
    `

    return NextResponse.json({ success: true, data: contentItems })
  } catch (error) {
    console.error('Get training module content error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch content' }, { status: 500 })
  }
}

// Create new content item for a training module
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const authUser = await verifyAuth(request)
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const moduleId = parseInt(resolvedParams.id)
    if (isNaN(moduleId)) {
      return NextResponse.json({ success: false, error: 'Invalid module ID' }, { status: 400 })
    }

    const body = await request.json()
    
    // Validate input
    const validation = trainingModuleContentSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ 
        success: false, 
        error: 'Validation failed',
        details: validation.error.issues
      }, { status: 400 })
    }

    const { title, description, contentType, url, fileData, fileName, fileSize, order, isActive } = validation.data

    // Auto-detect YouTube URLs
    let finalContentType = contentType
    const finalUrl = url

    if (url && (url.includes('youtube.com') || url.includes('youtu.be'))) {
      finalContentType = 'YOUTUBE'
    }

    // Insert content item
    const _result = await db.$executeRaw`
      INSERT INTO training_module_content 
      (title, description, contentType, url, fileData, fileName, fileSize, \`order\`, isActive, moduleId, createdAt, updatedAt)
      VALUES (${title}, ${description}, ${finalContentType}, ${finalUrl}, ${fileData}, ${fileName}, ${fileSize}, ${order}, ${isActive}, ${moduleId}, NOW(), NOW())
    `

    return NextResponse.json({ success: true, message: 'Content added successfully' })
  } catch (error) {
    console.error('Create training module content error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create content' }, { status: 500 })
  }
}

// Delete content item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const _resolvedParams = await params
    const authUser = await verifyAuth(request)
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const contentId = searchParams.get('contentId')

    if (!contentId || isNaN(parseInt(contentId))) {
      return NextResponse.json({ success: false, error: 'Invalid content ID' }, { status: 400 })
    }

    // Delete content item
    const _result = await db.$executeRaw`
      DELETE FROM training_module_content WHERE id = ${parseInt(contentId)}
    `

    return NextResponse.json({ success: true, message: 'Content deleted successfully' })
  } catch (error) {
    console.error('Delete training module content error:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete content' }, { status: 500 })
  }
}