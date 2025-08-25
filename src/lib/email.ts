import nodemailer from 'nodemailer'

interface EmailConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
}

interface SendEmailParams {
  to: string
  subject: string
  html: string
  text?: string
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null

  constructor() {
    this.initializeTransporter()
  }

  private initializeTransporter() {
    // Configuración para diferentes proveedores de email
    const emailConfig: EmailConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    }

    try {
      this.transporter = nodemailer.createTransport(emailConfig)
    } catch (error) {
      console.error('Error initializing email transporter:', error)
    }
  }

  async sendEmail({ to, subject, html, text }: SendEmailParams): Promise<boolean> {
    if (!this.transporter) {
      console.error('Email transporter not initialized')
      return false
    }

    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML tags for text version
      }

      const result = await this.transporter.sendMail(mailOptions)
      console.log('Email sent successfully:', result.messageId)
      return true
    } catch (error) {
      console.error('Error sending email:', error)
      return false
    }
  }

  async sendWelcomeEmail(userEmail: string, userName: string, temporaryPassword: string): Promise<boolean> {
    const subject = 'Welcome to Inegol Intranet - Access Credentials'
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Inegol Intranet</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ff6b35, #ff8c42); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px 20px; border-radius: 0 0 10px 10px; }
          .credentials { background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #ff6b35; margin: 20px 0; }
          .password { font-family: 'Courier New', monospace; font-size: 18px; font-weight: bold; color: #d73502; background: #fff3f0; padding: 10px; border-radius: 4px; border: 1px dashed #ff6b35; }
          .warning { background: #fff3cd; color: #856404; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Inegol Intranet!</h1>
            <p>Your account has been created successfully</p>
          </div>
          
          <div class="content">
            <h2>Hello ${userName},</h2>
            <p>Your account in the Inegol Intranet system has been created successfully. Below you will find your access credentials:</p>
            
            <div class="credentials">
              <h3>📧 Access Credentials</h3>
              <p><strong>Email:</strong> ${userEmail}</p>
              <p><strong>Temporary Password:</strong></p>
              <div class="password">${temporaryPassword}</div>
            </div>
            
            <div class="warning">
              <h4>⚠️ Important:</h4>
              <ul>
                <li>This is an automatically generated temporary password</li>
                <li>You must change it on your first system access</li>
                <li>Do not share these credentials with anyone</li>
                <li>If you did not request this account, contact the administrator immediately</li>
              </ul>
            </div>
            
            <h3>🔗 System Access</h3>
            <p>You can access the system at: <a href="${process.env.NEXTAUTH_URL || 'https://inegolintra.vercel.app/'}" style="color: #ff6b35;">${process.env.NEXTAUTH_URL || 'http://localhost:3000'}</a></p>
            
            <h3>📋 Next Steps</h3>
            <ol>
              <li>Log into the system with the provided credentials</li>
              <li>Go to "My Profile" to change your password</li>
              <li>Complete your profile information if necessary</li>
              <li>Explore the available functionalities according to your role</li>
            </ol>
            
            <div class="footer">
              <p>This email was automatically generated by the Inegol Intranet system.</p>
              <p>If you have any questions, contact the system administrator.</p>
              <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
              <p style="font-size: 12px; color: #999;">
                © ${new Date().getFullYear()} Inegol Law Firm. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `

    return this.sendEmail({ to: userEmail, subject, html })
  }

  async sendPasswordChangeNotification(userEmail: string, userName: string): Promise<boolean> {
    const subject = 'Password Updated - Inegol Intranet'
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Updated</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #28a745, #34ce57); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px 20px; border-radius: 0 0 10px 10px; }
          .security-info { background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #28a745; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Updated</h1>
            <p>Your password has been successfully changed</p>
          </div>
          
          <div class="content">
            <h2>Hello ${userName},</h2>
            <p>We confirm that your password in Inegol Intranet has been successfully updated.</p>
            
            <div class="security-info">
              <h3>📋 Update Details</h3>
              <p><strong>Date:</strong> ${new Date().toLocaleString('en-US')}</p>
              <p><strong>Account:</strong> ${userEmail}</p>
              <p><strong>Action:</strong> Password change</p>
            </div>
            
            <p>If you did not make this change, please contact the system administrator immediately.</p>
            
            <div class="footer">
              <p>This is an automatic security email from the Inegol Intranet system.</p>
              <p style="font-size: 12px; color: #999;">
                © ${new Date().getFullYear()} Inegol Law Firm. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `

    return this.sendEmail({ to: userEmail, subject, html })
  }
}

export const emailService = new EmailService()
