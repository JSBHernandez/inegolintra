import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    console.log('⚠️  /api/upload - Legacy upload endpoint called')
    console.log('⚠️  Request URL:', request.url)
    console.log('⚠️  This endpoint should only be used for profile photos from MyProfile.tsx')
    
    const authUser = await verifyAuth(request)
    if (!authUser) {
      console.log('Upload failed: Unauthorized user')
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    console.log(`⚠️  Legacy upload request from user: ${authUser.id} (${authUser.name})`)

    const data = await request.formData()
    const file: File | null = data.get('file') as unknown as File
    const type: string | null = data.get('type') as string
    const targetUserId: string | null = data.get('targetUserId') as string // New parameter for admin uploads

    console.log('Form data parsed, file present:', !!file)
    console.log('File details:', file ? { name: file.name, size: file.size, type: file.type } : 'No file')
    console.log('Target user ID:', targetUserId)

    if (!file) {
      console.log('Upload failed: No file in form data')
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 })
    }

    // Determine the actual user ID to store the file for
    let fileOwnerId = authUser.id // Default to authenticated user

    // If targetUserId is provided and user is admin, use that instead
    if (targetUserId && authUser.role === 'ADMIN') {
      const targetUserIdNum = parseInt(targetUserId)
      if (!isNaN(targetUserIdNum)) {
        // Verify target user exists
        const targetUser = await db.user.findUnique({
          where: { id: targetUserIdNum },
          select: { id: true }
        })
        
        if (targetUser) {
          fileOwnerId = targetUserIdNum
          console.log(`Admin upload: File will be stored for user ${fileOwnerId} instead of admin ${authUser.id}`)
        } else {
          console.log('Upload failed: Target user not found')
          return NextResponse.json({ success: false, error: 'Target user not found' }, { status: 400 })
        }
      }
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

    // Generate unique identifier for the file
    const timestamp = Date.now()
    const originalName = file.name.replace(/\s+/g, '-').toLowerCase()
    const extension = path.extname(originalName)
    const baseName = path.basename(originalName, extension)
    const fileType = isImage ? 'img' : 'doc'
    const uniqueId = `${fileType}-${fileOwnerId}-${timestamp}-${baseName}`

    console.log(`Creating file record in database for: ${file.name} (owner: ${fileOwnerId})`)

    // Create a file record in database
    const fileRecord = await db.userFile.create({
      data: {
        fileName: file.name,
        fileUrl: dataUrl, // Store the data URL directly
        fileType: file.type,
        fileSize: file.size,
        description: type === 'profile' ? 'Profile photo' : 'Uploaded file',
        userId: fileOwnerId, // Use the determined owner ID
        uploadedById: authUser.id, // Keep track of who actually uploaded it
      }
    })

    console.log(`File stored in database with ID: ${fileRecord.id}`)

    // Return a URL that points to our file serving endpoint
    const publicUrl = `/api/files/${fileRecord.id}`

    console.log(`Upload successful, file accessible at: ${publicUrl}`)

    return NextResponse.json({ 
      success: true, 
      url: publicUrl,
      fileId: fileRecord.id,
      filename: uniqueId,
      originalName: file.name,
      size: file.size,
      type: file.type
    })

  } catch (error) {
    console.error('File upload error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to upload file' 
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