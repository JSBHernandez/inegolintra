import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAuth, hashPassword, generateRandomPassword } from '@/lib/auth'
import { createUserSchema, updateUserSchema } from '@/lib/validations'

export async function GET(request: NextRequest) {
  try {
    const authUser = await verifyAuth(request)
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const users = await db.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        position: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ success: true, data: users })
  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch users' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await verifyAuth(request)
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createUserSchema.parse(body)

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email: validatedData.email.toLowerCase() }
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email already exists' },
        { status: 400 }
      )
    }

    // Generate random password
    const temporaryPassword = generateRandomPassword(16)
    const hashedPassword = await hashPassword(temporaryPassword)

    const newUser = await db.user.create({
      data: {
        email: validatedData.email.toLowerCase(),
        name: validatedData.name,
        position: validatedData.position,
        role: validatedData.role,
        password: hashedPassword,
        mustChangePassword: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        position: true,
        role: true,
        isActive: true,
        createdAt: true,
      }
    })

    // TODO: Send email with temporary password
    console.log(`Temporary password for ${newUser.email}: ${temporaryPassword}`)

    return NextResponse.json(
      { 
        success: true, 
        data: newUser,
        temporaryPassword // Remove this in production and send via email
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create user error:', error)
    if (error instanceof Error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: 'Failed to create user' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authUser = await verifyAuth(request)
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updateData } = body
    
    if (!id) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 })
    }

    const validatedData = updateUserSchema.parse(updateData)

    const updatedUser = await db.user.update({
      where: { id: parseInt(id) },
      data: validatedData,
      select: {
        id: true,
        email: true,
        name: true,
        position: true,
        role: true,
        isActive: true,
        updatedAt: true,
      }
    })

    return NextResponse.json({ success: true, data: updatedUser })
  } catch (error) {
    console.error('Update user error:', error)
    if (error instanceof Error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: 'Failed to update user' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authUser = await verifyAuth(request)
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 })
    }

    // Don't allow deleting yourself
    if (parseInt(id) === authUser.id) {
      return NextResponse.json({ success: false, error: 'Cannot delete your own account' }, { status: 400 })
    }

    await db.user.delete({
      where: { id: parseInt(id) }
    })

    return NextResponse.json({ success: true, message: 'User deleted successfully' })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete user' }, { status: 500 })
  }
}
