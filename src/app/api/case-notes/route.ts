import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  // Check authentication
  if (!verifyAuth(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { clientCaseId, content } = await request.json()
    
    if (!clientCaseId || !content) {
      return NextResponse.json({ success: false, error: 'Client case ID and content are required' }, { status: 400 })
    }

    // Create the case note
    const caseNote = await db.caseNote.create({
      data: {
        content: content.trim(),
        clientCaseId: parseInt(clientCaseId),
      },
    })
    
    return NextResponse.json({ success: true, data: caseNote }, { status: 201 })
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: 'An unexpected error occurred' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  // Check authentication
  if (!verifyAuth(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const clientCaseId = searchParams.get('clientCaseId')
    
    if (!clientCaseId) {
      return NextResponse.json({ success: false, error: 'Client case ID is required' }, { status: 400 })
    }

    const caseNotes = await db.caseNote.findMany({
      where: {
        clientCaseId: parseInt(clientCaseId),
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    
    return NextResponse.json({ success: true, data: caseNotes })
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: false, error: 'An unexpected error occurred' }, { status: 500 })
  }
}
