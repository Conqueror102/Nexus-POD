import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'

export async function POST(request: Request) {
  const { to } = await request.json()
  
  if (!to) {
    return NextResponse.json({ error: 'Email address required' }, { status: 400 })
  }

  const result = await sendEmail({
    to,
    subject: 'Test Email from Nexus Pod',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #2563eb; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Nexus Pod</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #1f2937; margin-top: 0;">Email Setup Successful!</h2>
          <p style="color: #4b5563; line-height: 1.6;">
            Your email notifications are now configured correctly.
          </p>
        </div>
      </div>
    `,
  })

  if (result.success) {
    return NextResponse.json({ success: true, messageId: result.messageId })
  } else {
    return NextResponse.json({ error: 'Failed to send email', details: result.error }, { status: 500 })
  }
}
