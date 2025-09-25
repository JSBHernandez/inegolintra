import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const authUser = await verifyAuth(request)
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.formData()
    const file: File | null = data.get('file') as unknown as File
    const type: string | null = data.get('type') as string

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ success: false, error: 'Only image files are allowed' }, { status: 400 })
    }

    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'File size must be less than 2MB' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique filename
    const timestamp = Date.now()
    const originalName = file.name.replace(/\s+/g, '-').toLowerCase()
    const extension = path.extname(originalName)
    const filename = `${type || 'file'}-${authUser.id}-${timestamp}${extension}`

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    try {
      await mkdir(uploadsDir, { recursive: true })
    } catch (error) {
      // Directory might already exist, ignore error
    }

    // Save file
    const filepath = path.join(uploadsDir, filename)
    await writeFile(filepath, buffer)

    // Return public URL
    const publicUrl = `/uploads/${filename}`

    return NextResponse.json({ 
      success: true, 
      url: publicUrl,
      filename: filename,
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