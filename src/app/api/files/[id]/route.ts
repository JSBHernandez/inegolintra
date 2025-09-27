import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'

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

    const fileId = parseInt(resolvedParams.id)
    if (isNaN(fileId)) {
      return NextResponse.json({ success: false, error: 'Invalid file ID' }, { status: 400 })
    }

    // Check if this is a request for direct data URL
    const url = new URL(request.url)
    const isDirect = url.searchParams.get('direct') === 'true'

    // Get file from database
    const file = await db.userFile.findUnique({
      where: { id: fileId },
      select: {
        id: true,
        fileName: true,
        fileUrl: true,
        fileType: true,
        fileSize: true,
        userId: true,
        user: {
          select: { name: true }
        }
      }
    })

    if (!file) {
      return NextResponse.json({ success: false, error: 'File not found' }, { status: 404 })
    }

    // Check permissions - allow if user owns file or is admin
    if (authUser.role !== 'ADMIN' && file.userId !== authUser.id) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 })
    }

    // If requesting direct data URL, return it as JSON
    if (isDirect && file.fileUrl.startsWith('data:')) {
      return NextResponse.json({ 
        success: true, 
        dataUrl: file.fileUrl,
        fileName: file.fileName,
        fileType: file.fileType
      })
    }

    // If it's a data URL, serve it directly
    if (file.fileUrl.startsWith('data:')) {
      const [mimeInfo, base64Data] = file.fileUrl.split(',')
      const mimeType = mimeInfo.split(':')[1].split(';')[0]
      
      console.log(`Serving file ${fileId}:`, {
        fileName: file.fileName,
        mimeType,
        dataLength: base64Data.length,
        isBase64Valid: /^[A-Za-z0-9+/]*={0,2}$/.test(base64Data)
      })
      
      const buffer = Buffer.from(base64Data, 'base64')

      // Determine if file should be displayed inline (for images) or as attachment
      const isImage = mimeType.startsWith('image/')
      const contentDisposition = isImage ? 'inline' : `attachment; filename="${file.fileName}"`

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': mimeType,
          'Content-Length': buffer.length.toString(),
          'Content-Disposition': contentDisposition,
          'Cache-Control': 'public, max-age=3600',
          'X-Content-Type-Options': 'nosniff'
        }
      })
    }

    // If it's a regular URL, redirect to it
    return NextResponse.redirect(file.fileUrl)

  } catch (error) {
    console.error('File serving error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to serve file' 
    }, { status: 500 })
  }
}