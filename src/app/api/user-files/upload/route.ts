import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    console.log('User file upload request received')
    
    const authUser = await verifyAuth(request)
    if (!authUser) {
      console.log('Upload failed: Unauthorized user')
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    console.log(`User file upload request from user: ${authUser.id}`)

    const data = await request.formData()
    const file: File | null = data.get('file') as unknown as File
    const description: string | null = data.get('description') as string

    console.log('Form data parsed:', { 
      hasFile: !!file,
      description: description || 'No description provided',
      fileDetails: file ? { name: file.name, size: file.size, type: file.type } : 'No file'
    })

    if (!file) {
      console.log('Upload failed: No file in form data')
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 })
    }

    // Validate file type - Allow documents and images for personal files
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

    // Validate file size (2MB limit for personal files to match component limit)
    const maxSize = 2 * 1024 * 1024 // 2MB
    
    if (file.size > maxSize) {
      console.log(`Upload failed: File size ${file.size} exceeds limit ${maxSize}`)
      return NextResponse.json({ 
        success: false, 
        error: `File size must be less than 2MB` 
      }, { status: 400 })
    }

    console.log('File size validation passed')

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    console.log('Converting file to base64 for database storage...')

    // Convert to base64 for database storage
    const base64Data = buffer.toString('base64')
    const dataUrl = `data:${file.type};base64,${base64Data}`

    console.log(`Creating user file record for: ${file.name}`)

    // Use provided description or default
    const fileDescription = description || 'Personal file uploaded by user'

    // Create a user file record using raw query
    const _insertResult = await db.$queryRaw`
      INSERT INTO user_files 
      (fileName, fileUrl, fileType, fileSize, description, userId, uploadedById, createdAt, updatedAt)
      VALUES 
      (${file.name}, ${dataUrl}, ${file.type}, ${file.size}, ${fileDescription}, ${authUser.id}, ${authUser.id}, NOW(), NOW())
    `

    // Get the created record ID
    const createdIdResult = await db.$queryRaw`SELECT LAST_INSERT_ID() as id`
    const rawFileId = Array.isArray(createdIdResult) && createdIdResult.length > 0
      ? (createdIdResult[0] as { id: bigint }).id
      : null

    if (!rawFileId) {
      throw new Error('Failed to create user file record')
    }

    // Convert BigInt to regular number for JSON serialization
    const fileId = Number(rawFileId)

    console.log(`User file stored with ID: ${fileId}`)

    // Return a URL that points to our user file serving endpoint
    const publicUrl = `/api/files/${fileId}`

    console.log(`User file upload successful, file accessible at: ${publicUrl}`)

    return NextResponse.json({ 
      success: true, 
      url: publicUrl,
      fileId: fileId,
      filename: file.name,
      originalName: file.name,
      size: file.size,
      type: file.type
    })

  } catch (error) {
    console.error('User file upload error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to upload user file' 
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