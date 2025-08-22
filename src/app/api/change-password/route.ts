import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAuth, verifyPassword, hashPassword } from '@/lib/auth'
import { passwordChangeSchema } from '@/lib/validations'
import { emailService } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const authUser = await verifyAuth(request)
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = passwordChangeSchema.parse(body)

    // Get current user from database
    const user = await db.user.findUnique({
      where: { id: authUser.id },
      select: { password: true }
    })

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    // Verify current password
    const isCurrentPasswordValid = await verifyPassword(validatedData.currentPassword, user.password)
    if (!isCurrentPasswordValid) {
      return NextResponse.json({ 
        success: false, 
        error: 'Current password is incorrect' 
      }, { status: 400 })
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(validatedData.newPassword)

    // Update password and clear mustChangePassword flag
    await db.user.update({
      where: { id: authUser.id },
      data: {
        password: hashedNewPassword,
        mustChangePassword: false,
      }
    })

    // Send password change notification email
    try {
      await emailService.sendPasswordChangeNotification(
        authUser.email,
        authUser.name
      )
    } catch (emailError) {
      console.error('Error sending password change notification:', emailError)
      // Don't fail the password change if email fails
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Contraseña actualizada exitosamente. Se ha enviado una confirmación por correo electrónico.' 
    })
  } catch (error) {
    console.error('Password change error:', error)
    if (error instanceof Error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: 'Failed to change password' }, { status: 500 })
  }
}
