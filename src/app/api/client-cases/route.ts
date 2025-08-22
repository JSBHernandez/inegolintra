import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { clientCaseSchema } from '@/lib/validations'
import { verifyAuth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  // Check authentication
  if (!verifyAuth(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    
    // Validate the request body
    const validatedData = clientCaseSchema.parse(body)
    
    // Create the client case in the database
    const clientCase = await db.clientCase.create({
      data: {
        clientName: validatedData.clientName,
        caseType: validatedData.caseType,
        status: validatedData.status,
        notes: validatedData.notes,
        totalContract: validatedData.totalContract || null,
        paralegal: (validatedData.paralegal && validatedData.paralegal.trim() !== '') ? validatedData.paralegal : null,
      },
    })
    
    // If there are notes, also create a CaseNote entry
    if (validatedData.notes && validatedData.notes.trim()) {
      await db.caseNote.create({
        data: {
          content: validatedData.notes.trim(),
          clientCaseId: clientCase.id,
        },
      })
    }
    
    return NextResponse.json({ success: true, data: clientCase }, { status: 201 })
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
    const clientCases = await db.clientCase.findMany({
      include: {
        caseNotes: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1 // Only get the latest note
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    
    // Transform the data to include the latest note text
    const transformedCases = clientCases.map((clientCase) => ({
      ...clientCase,
      latestNote: clientCase.caseNotes[0]?.content || null,
      latestNoteDate: clientCase.caseNotes[0]?.createdAt || null,
      caseNotes: undefined // Remove the caseNotes array from the response
    }))
    
    return NextResponse.json({ success: true, data: transformedCases })
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: false, error: 'An unexpected error occurred' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  // Check authentication
  if (!verifyAuth(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { id, ...updateData } = body
    
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required for update' }, { status: 400 })
    }
    
    // Validate the request body
    const validatedData = clientCaseSchema.parse(updateData)
    
    // Get the current case with its latest note
    const currentCase = await db.clientCase.findUnique({
      where: { id: parseInt(id) },
      include: {
        caseNotes: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    })
    
    if (!currentCase) {
      return NextResponse.json({ success: false, error: 'Case not found' }, { status: 404 })
    }
    
    // Update the client case in the database
    const updatedClientCase = await db.clientCase.update({
      where: { id: parseInt(id) },
      data: {
        clientName: validatedData.clientName,
        caseType: validatedData.caseType,
        status: validatedData.status,
        notes: validatedData.notes,
        totalContract: validatedData.totalContract || null,
        paralegal: (validatedData.paralegal && validatedData.paralegal.trim() !== '') ? validatedData.paralegal : null,
      },
    })
    
    // Handle notes update
    if (validatedData.notes && validatedData.notes.trim()) {
      const latestNote = currentCase.caseNotes[0]
      
      if (latestNote) {
        // Update the existing latest note
        await db.caseNote.update({
          where: { id: latestNote.id },
          data: {
            content: validatedData.notes.trim(),
          },
        })
      } else {
        // Create a new note if none exists
        await db.caseNote.create({
          data: {
            content: validatedData.notes.trim(),
            clientCaseId: parseInt(id),
          },
        })
      }
    }
    
    return NextResponse.json({ success: true, data: updatedClientCase })
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: 'An unexpected error occurred' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  // Check authentication
  if (!verifyAuth(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required for deletion' }, { status: 400 })
    }
    
    // Delete the client case from the database
    await db.clientCase.delete({
      where: { id: parseInt(id) },
    })
    
    return NextResponse.json({ success: true, message: 'Client case deleted successfully' })
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: 'An unexpected error occurred' }, { status: 500 })
  }
}
