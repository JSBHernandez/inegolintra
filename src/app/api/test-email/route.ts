import { NextRequest, NextResponse } from 'next/server'
import { emailService } from '@/lib/email'
import { verifyAuth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const authUser = await verifyAuth(request)
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { emailType, recipientEmail, recipientName } = body

    console.log('🧪 Testing email with configuration:')
    console.log('- SMTP_HOST:', process.env.SMTP_HOST)
    console.log('- SMTP_PORT:', process.env.SMTP_PORT)
    console.log('- SMTP_USER:', process.env.SMTP_USER)
    console.log('- SMTP_FROM:', process.env.SMTP_FROM)
    console.log('- NEXTAUTH_URL:', process.env.NEXTAUTH_URL)

    let emailSent = false

    switch (emailType) {
      case 'welcome':
        emailSent = await emailService.sendWelcomeEmail(
          recipientEmail,
          recipientName,
          'TestPassword123!'
        )
        break
      
      case 'permission-approved':
        emailSent = await emailService.sendPermissionDecisionEmail(
          recipientEmail,
          recipientName,
          'Annual Leave',
          'APPROVED',
          new Date().toISOString(),
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          'Personal vacation',
          'Your request has been approved. Enjoy your time off!'
        )
        break
      
      case 'permission-rejected':
        emailSent = await emailService.sendPermissionDecisionEmail(
          recipientEmail,
          recipientName,
          'Sick Leave',
          'REJECTED',
          new Date().toISOString(),
          new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          'Need medical attention',
          'Please provide medical documentation to support your request.'
        )
        break
      
      default:
        return NextResponse.json({ success: false, error: 'Invalid email type' }, { status: 400 })
    }

    if (emailSent) {
      return NextResponse.json({ 
        success: true, 
        message: `${emailType} email sent successfully to ${recipientEmail}`,
        config: {
          smtpHost: process.env.SMTP_HOST,
          smtpUser: process.env.SMTP_USER,
          nextAuthUrl: process.env.NEXTAUTH_URL
        }
      })
    } else {
      return NextResponse.json({ success: false, error: 'Failed to send email' }, { status: 500 })
    }

  } catch (error) {
    console.error('Test email error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}