import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'
import { updateCompleteProfileSchema } from '@/lib/validations'

export async function PUT(request: NextRequest) {
  try {
    const authUser = await verifyAuth(request)
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateCompleteProfileSchema.parse(body)

    // Determine which user profile to update
    let targetUserId = authUser.id // Default to authenticated user
    
    // If userId is provided in the request and user is admin, update that user's profile
    if (validatedData.userId && authUser.role === 'ADMIN') {
      // Verify target user exists
      const targetUser = await db.user.findUnique({
        where: { id: validatedData.userId },
        select: { id: true }
      })
      
      if (targetUser) {
        targetUserId = validatedData.userId
        console.log(`Admin updating profile for user ${targetUserId}`)
      } else {
        return NextResponse.json({ success: false, error: 'Target user not found' }, { status: 400 })
      }
    }

    // Update user profile (both basic and additional info)
    const updatedUser = await db.user.update({
      where: { id: targetUserId },
      data: {
        // Basic information
        name: validatedData.name,
        position: validatedData.position,
        // Additional information
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
