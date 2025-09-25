import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'
import { updateProfileSchema } from '@/lib/validations'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await verifyAuth(request)
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const userId = parseInt(id)
    if (isNaN(userId)) {
      return NextResponse.json({ success: false, error: 'Invalid user ID' }, { status: 400 })
    }

    // Only allow admins to get other users, or users to get themselves
    if (authUser.role !== 'ADMIN' && authUser.id !== userId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        position: true,
        address: true,
        country: true,
        personalPhone: true,
        emergencyPhone: true,
        emergencyContactName: true,
        profilePhoto: true,
        mustChangePassword: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: user })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch user' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await verifyAuth(request)
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const userId = parseInt(id)
    if (isNaN(userId)) {
      return NextResponse.json({ success: false, error: 'Invalid user ID' }, { status: 400 })
    }

    // Only allow admins to update other users, or users to update themselves
    if (authUser.role !== 'ADMIN' && authUser.id !== userId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    
    // Validate the data
    const validatedData = updateProfileSchema.parse(body)

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id: userId }
    })

    if (!existingUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    // Update the user
    console.log('Updating user with data:', {
      userId,
      validatedData,
      address: validatedData.address,
      country: validatedData.country
    })

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        address: validatedData.address && validatedData.address.trim() !== '' ? validatedData.address.trim() : null,
        country: validatedData.country && validatedData.country.trim() !== '' ? validatedData.country.trim() : null,
        personalPhone: validatedData.personalPhone && validatedData.personalPhone.trim() !== '' ? validatedData.personalPhone.trim() : null,
        emergencyPhone: validatedData.emergencyPhone && validatedData.emergencyPhone.trim() !== '' ? validatedData.emergencyPhone.trim() : null,
        emergencyContactName: validatedData.emergencyContactName && validatedData.emergencyContactName.trim() !== '' ? validatedData.emergencyContactName.trim() : null,
        profilePhoto: validatedData.profilePhoto && validatedData.profilePhoto.trim() !== '' ? validatedData.profilePhoto.trim() : null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        position: true,
        address: true,
        country: true,
        personalPhone: true,
        emergencyPhone: true,
        emergencyContactName: true,
        profilePhoto: true,
        isActive: true,
        mustChangePassword: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    console.log('User updated successfully:', {
      id: updatedUser.id,
      address: updatedUser.address,
      country: updatedUser.country,
      personalPhone: updatedUser.personalPhone
    })

    // Verify the update by fetching the user again
    const verifyUser = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        address: true,
        country: true,
        personalPhone: true,
        emergencyPhone: true,
        emergencyContactName: true,
        profilePhoto: true,
      }
    })
    
    console.log('Verification - User data in DB after update:', verifyUser)

    return NextResponse.json({ success: true, data: updatedUser })
  } catch (error) {
    console.error('Update user error:', error)
    
    if (error && typeof error === 'object' && 'issues' in error) {
      // Zod validation error
      const zodError = error as { issues: Array<{ message: string; path: string[] }> }
      const errorMessage = zodError.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ')
      return NextResponse.json({ success: false, error: errorMessage }, { status: 400 })
    }

    return NextResponse.json({ success: false, error: 'Failed to update user' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await verifyAuth(request)
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

    const { id } = await params
    const userId = parseInt(id)
    if (isNaN(userId)) {
      return NextResponse.json({ success: false, error: 'Invalid user ID' }, { status: 400 })
    }

    // Prevent admin from deleting themselves
    if (authUser.id === userId) {
      return NextResponse.json({ success: false, error: 'Cannot delete your own account' }, { status: 400 })
    }

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id: userId }
    })

    if (!existingUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    // Delete the user
    await db.user.delete({
      where: { id: userId }
    })

    return NextResponse.json({ success: true, message: 'User deleted successfully' })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete user' }, { status: 500 })
  }
}