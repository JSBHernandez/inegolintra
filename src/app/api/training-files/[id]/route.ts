import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    console.log('Training file serving request received')
    
    const authUser = await verifyAuth(request)
    if (!authUser) {
      console.log('File access failed: Unauthorized user')
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const contentId = parseInt(id)

    if (isNaN(contentId)) {
      console.log('Invalid content ID provided')
      return NextResponse.json({ success: false, error: 'Invalid content ID' }, { status: 400 })
    }

    console.log(`Fetching training module content with ID: ${contentId}`)

    // Get the training module content using raw query for consistency
    const contentResult = await db.$queryRaw`
      SELECT 
        tmc.id, tmc.title, tmc.description, tmc.contentType, 
        tmc.fileData, tmc.fileName, tmc.fileSize, tmc.isActive,
        tm.id as moduleId, tm.title as moduleTitle, tm.isActive as moduleIsActive
      FROM training_module_content tmc
      INNER JOIN training_modules tm ON tmc.moduleId = tm.id
      WHERE tmc.id = ${contentId}
      LIMIT 1
    `

    const content = Array.isArray(contentResult) && contentResult.length > 0 ? contentResult[0] : null

    if (!content) {
      console.log(`Training content ${contentId} not found`)
      return NextResponse.json({ success: false, error: 'Content not found' }, { status: 404 })
    }

    // Type assertion to help TypeScript understand the structure
    const contentData = content as {
      id: number
      title: string
      description?: string
      contentType: string
      fileData?: string
      fileName?: string
      fileSize?: number
      isActive: boolean
      moduleId: number
      moduleTitle: string
      moduleIsActive: boolean
    }

    if (!contentData.moduleIsActive || !contentData.isActive) {
      console.log(`Training content ${contentId} or module is inactive`)
      return NextResponse.json({ success: false, error: 'Content not available' }, { status: 404 })
    }

    if (!contentData.fileData || !contentData.fileName) {
      console.log(`Training content ${contentId} has no file data`)
      return NextResponse.json({ success: false, error: 'No file data available' }, { status: 404 })
    }

    console.log(`Serving training file: ${contentData.fileName}`)

    // Parse the data URL to extract the file data
    const dataUrlMatch = contentData.fileData.match(/^data:([^;]+);base64,(.+)$/)
    if (!dataUrlMatch) {
      console.log('Invalid file data format')
      return NextResponse.json({ success: false, error: 'Invalid file data format' }, { status: 500 })
    }

    const mimeType = dataUrlMatch[1]
    const base64Data = dataUrlMatch[2]
    const buffer = Buffer.from(base64Data, 'base64')

    console.log(`File served successfully: ${contentData.fileName}, size: ${buffer.length} bytes`)

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${contentData.fileName}"`,
        'Content-Length': buffer.length.toString(),
      },
    })

  } catch (error) {
    console.error('Training file serving error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to serve file' 
    }, { status: 500 })
  }
}