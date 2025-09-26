import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    console.log('Training file upload request received')
    
    const authUser = await verifyAuth(request)
    if (!authUser) {
      console.log('Upload failed: Unauthorized user')
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    console.log(`Training file upload request from user: ${authUser.id}`)

    const data = await request.formData()
    const file: File | null = data.get('file') as unknown as File
    const moduleId: string | null = data.get('moduleId') as string
    const title: string | null = data.get('title') as string
    const description: string | null = data.get('description') as string

    console.log('Form data parsed:', { 
      hasFile: !!file, 
      moduleId, 
      title, 
      description,
      fileDetails: file ? { name: file.name, size: file.size, type: file.type } : 'No file'
    })

    if (!file) {
      console.log('Upload failed: No file in form data')
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 })
    }

    if (!moduleId || !title) {
      console.log('Upload failed: Missing required fields')
      return NextResponse.json({ success: false, error: 'Module ID and title are required' }, { status: 400 })
    }

    // Verify trainingModule exists and user has access
    const trainingModule = await db.trainingModule.findUnique({
      where: { id: parseInt(moduleId) }
    })

    if (!trainingModule) {
      console.log(`Upload failed: Module ${moduleId} not found`)
      return NextResponse.json({ success: false, error: 'Training module not found' }, { status: 404 })
    }

    // Validate file type - Allow documents and images
    const allowedTypes = [
      // Images
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      // Documents
      'application/pdf',
      'application/msword', // .doc
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/vnd.ms-excel', // .xls
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-powerpoint', // .ppt
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
      'text/plain', // .txt
      'application/zip', // .zip
      'application/x-rar-compressed', // .rar
    ]

    if (!allowedTypes.includes(file.type)) {
      console.log(`Upload failed: Invalid file type ${file.type}`)
      return NextResponse.json({ 
        success: false, 
        error: `File type ${file.type} is not allowed. Allowed types: PDF, Word, Excel, PowerPoint, Images, Text files.` 
      }, { status: 400 })
    }

    console.log('File type validation passed')

    // Validate file size (10MB limit for documents, 5MB for images)
    const isImage = file.type.startsWith('image/')
    const maxSize = isImage ? 5 * 1024 * 1024 : 10 * 1024 * 1024 // 5MB for images, 10MB for documents
    
    if (file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024)
      console.log(`Upload failed: File size ${file.size} exceeds limit ${maxSize}`)
      return NextResponse.json({ 
        success: false, 
        error: `File size must be less than ${maxSizeMB}MB` 
      }, { status: 400 })
    }

    console.log('File size validation passed')

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    console.log('Converting file to base64 for database storage...')

    // Convert to base64 for database storage
    const base64Data = buffer.toString('base64')
    const dataUrl = `data:${file.type};base64,${base64Data}`

    // Get the next order for this module using raw query
    const orderResult = await db.$queryRaw`
      SELECT MAX(\`order\`) as maxOrder 
      FROM training_module_content 
      WHERE moduleId = ${parseInt(moduleId)}
    `
    const maxOrder = Array.isArray(orderResult) && orderResult.length > 0 
      ? (orderResult[0] as { maxOrder: number | null }).maxOrder || 0 
      : 0
    const nextOrder = maxOrder + 1

    console.log(`Creating training module content record for: ${file.name}`)

    // Create a content record for the training module using raw query
    const _insertResult = await db.$queryRaw`
      INSERT INTO training_module_content 
      (title, description, contentType, fileData, fileName, fileSize, \`order\`, moduleId, isActive, createdAt, updatedAt)
      VALUES 
      (${title}, ${description || `File: ${file.name}`}, 'DOCUMENT', ${dataUrl}, ${file.name}, ${file.size}, ${nextOrder}, ${parseInt(moduleId)}, true, NOW(), NOW())
    `

    // Get the created record ID
    const createdIdResult = await db.$queryRaw`SELECT LAST_INSERT_ID() as id`
    const rawContentId = Array.isArray(createdIdResult) && createdIdResult.length > 0
      ? (createdIdResult[0] as { id: bigint }).id
      : null

    if (!rawContentId) {
      throw new Error('Failed to create content record')
    }

    // Convert BigInt to regular number for JSON serialization
    const contentId = Number(rawContentId)

    console.log(`Training module content stored with ID: ${contentId}`)

    // Return a URL that points to our training file serving endpoint
    const publicUrl = `/api/training-files/${contentId}`

    console.log(`Training file upload successful, file accessible at: ${publicUrl}`)

    return NextResponse.json({ 
      success: true, 
      url: publicUrl,
      fileId: contentId,
      filename: file.name,
      originalName: file.name,
      size: file.size,
      type: file.type,
      contentId: contentId
    })

  } catch (error) {
    console.error('Training file upload error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to upload training file' 
    }, { status: 500 })
  }
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json({ 
    success: false, 
    error: 'Method not allowed' 
  }, { status: 405 })
}