import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail({ to, subject, html, text }: EmailOptions) {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Nexus Pod" <noreply@nexuspod.com>',
      to,
      subject,
      text: text || html.replace(/<[^>]*>/g, ""),
      html,
    })
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("Email send error:", error)
    return { success: false, error }
  }
}

export function taskAssignedEmail(taskName: string, projectName: string, assignerName: string) {
  return {
    subject: `Task Assigned: ${taskName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #2563eb; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Nexus Pod</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #1f2937; margin-top: 0;">New Task Assigned</h2>
          <p style="color: #4b5563; line-height: 1.6;">
            <strong>${assignerName}</strong> assigned you a new task:
          </p>
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin: 0 0 8px 0;">${taskName}</h3>
            <p style="color: #6b7280; margin: 0; font-size: 14px;">Project: ${projectName}</p>
          </div>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard" 
             style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
            View Task
          </a>
        </div>
        <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
          © ${new Date().getFullYear()} Nexus Pod. Built for African founders.
        </div>
      </div>
    `,
  }
}

export function taskReminderEmail(taskName: string, projectName: string, dueDate: string, hoursRemaining: number) {
  const urgencyColor = hoursRemaining <= 1 ? "#dc2626" : hoursRemaining <= 6 ? "#f59e0b" : "#2563eb"
  
  return {
    subject: `⏰ Task Due ${hoursRemaining <= 1 ? "in 1 hour" : `in ${hoursRemaining} hours`}: ${taskName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: ${urgencyColor}; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Nexus Pod</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #1f2937; margin-top: 0;">Task Due Soon!</h2>
          <p style="color: #4b5563; line-height: 1.6;">
            Your task is due ${hoursRemaining <= 1 ? "in 1 hour" : `in ${hoursRemaining} hours`}:
          </p>
          <div style="background: white; border: 1px solid #e5e7eb; border-left: 4px solid ${urgencyColor}; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin: 0 0 8px 0;">${taskName}</h3>
            <p style="color: #6b7280; margin: 0 0 8px 0; font-size: 14px;">Project: ${projectName}</p>
            <p style="color: ${urgencyColor}; margin: 0; font-size: 14px; font-weight: 500;">Due: ${dueDate}</p>
          </div>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard" 
             style="display: inline-block; background: ${urgencyColor}; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
            View Task
          </a>
        </div>
        <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
          © ${new Date().getFullYear()} Nexus Pod. Built for African founders.
        </div>
      </div>
    `,
  }
}

export function podInviteEmail(podName: string, inviterName: string, inviteLink: string) {
  return {
    subject: `You're invited to join ${podName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #2563eb; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Nexus Pod</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #1f2937; margin-top: 0;">You've Been Invited!</h2>
          <p style="color: #4b5563; line-height: 1.6;">
            <strong>${inviterName}</strong> has invited you to join their pod:
          </p>
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
            <h3 style="color: #1f2937; margin: 0;">${podName}</h3>
          </div>
          <a href="${inviteLink}" 
             style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
            Accept Invitation
          </a>
        </div>
        <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
          © ${new Date().getFullYear()} Nexus Pod. Built for African founders.
        </div>
      </div>
    `,
  }
}

export function commentAddedEmail(taskName: string, commenterName: string, commentText: string) {
  return {
    subject: `New comment on: ${taskName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #2563eb; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Nexus Pod</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #1f2937; margin-top: 0;">New Comment</h2>
          <p style="color: #4b5563; line-height: 1.6;">
            <strong>${commenterName}</strong> commented on <strong>${taskName}</strong>:
          </p>
          <div style="background: white; border: 1px solid #e5e7eb; border-left: 4px solid #2563eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="color: #4b5563; margin: 0; line-height: 1.6;">${commentText}</p>
          </div>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard" 
             style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
            View Task
          </a>
        </div>
        <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
          © ${new Date().getFullYear()} Nexus Pod. Built for African founders.
        </div>
      </div>
    `,
  }
}
