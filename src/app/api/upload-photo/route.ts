import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { writeFile } from 'fs/promises'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    const authUser = await verifyAuth(request)
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.formData()
    const file: File | null = data.get('photo') as unknown as File

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ success: false, error: 'File must be an image' }, { status: 400 })
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'File size must be less than 5MB' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create unique filename
    const timestamp = Date.now()
    const extension = file.name.split('.').pop()
    const filename = `profile-${authUser.id}-${timestamp}.${extension}`
    const filepath = join(process.cwd(), 'public', 'uploads', filename)

    // Ensure uploads directory exists
    const { mkdir } = await import('fs/promises')
    const uploadsDir = join(process.cwd(), 'public', 'uploads')
    try {
      await mkdir(uploadsDir, { recursive: true })
    } catch (error) {
      // Directory already exists
    }

    await writeFile(filepath, buffer)

    const photoUrl = `/uploads/${filename}`

    return NextResponse.json({ 
      success: true, 
      photoUrl: photoUrl
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to upload photo' 
    }, { status: 500 })
  }
}
