import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_request: NextRequest) {
  try {
    const result = await db.$queryRaw`
      SELECT id, title, category, CHAR_LENGTH(category) as category_length,
             description, isActive, createdAt, updatedAt 
      FROM training_modules 
      ORDER BY id DESC 
      LIMIT 10
    `

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Debug data from training_modules table'
    })
  } catch (error) {
    console.error('Debug query error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to execute debug query' },
      { status: 500 }
    )
  }
}