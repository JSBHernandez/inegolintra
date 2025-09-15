import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'
import { updateProfileSchema } from '@/lib/validations'

export async function PUT(request: NextRequest) {
  try {
    const authUser = await verifyAuth(request)
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateProfileSchema.parse(body)

    // Update user profile
    const updatedUser = await db.user.update({
      where: { id: authUser.id },
      data: {
        address: validatedData.address || null,
        country: validatedData.country || null,
        personalPhone: validatedData.personalPhone || null,
        emergencyPhone: validatedData.emergencyPhone || null,
        emergencyContactName: validatedData.emergencyContactName || null,
        profilePhoto: validatedData.profilePhoto || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        position: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        address: true,
        country: true,
        personalPhone: true,
        emergencyPhone: true,
        emergencyContactName: true,
        profilePhoto: true,
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Profile updated successfully',
      data: updatedUser
    })

  } catch (error) {
    console.error('Profile update error:', error)
    
    if (error && typeof error === 'object' && 'issues' in error) {
      // Zod validation error
      const zodError = error as { issues: Array<{ message: string; path: string[] }> }
      const errorMessage = zodError.issues.map(issue => issue.message).join(', ')
      return NextResponse.json({ 
        success: false, 
        error: errorMessage 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
