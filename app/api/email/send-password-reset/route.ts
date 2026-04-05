/**
 * Password Reset Email Handler
 */

import { NextRequest, NextResponse } from 'next/server';

interface PasswordResetPayload {
  email: string;
  resetLink: string;
}

export async function POST(request: NextRequest) {
  try {
    const { email, resetLink } = (await request.json()) as PasswordResetPayload;

    if (!email || !resetLink) {
      return NextResponse.json(
        { error: 'Missing email or reset link' },
        { status: 400 }
      );
    }

    // Create HTML email template
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2c7d3f; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .button {
              background-color: #2c7d3f;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 5px;
              display: inline-block;
              margin: 20px 0;
            }
            .footer { font-size: 12px; color: #999; padding: 20px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>We received a request to reset your password. Click the button below to create a new password:</p>
              <a href="${resetLink}" class="button">Reset Your Password</a>
              <p>This link will expire in 24 hours.</p>
              <p>If you didn't request this, you can ignore this email. Your password will remain unchanged.</p>
              <hr />
              <p><strong>Security Note:</strong> Never share this link with anyone. NCDF COOP will never ask for your password via email.</p>
            </div>
            <div class="footer">
              <p>&copy; 2026 NCDF COOP. All rights reserved.</p>
              <p>These are automated messages. Do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Password Reset Request

We received a request to reset your password. 
Click the link below to create a new password:

${resetLink}

This link will expire in 24 hours.

If you didn't request this, you can ignore this email.

Security Note: Never share this link with anyone.
    `.trim();

    // Call the main email sending endpoint
    const response = await fetch(
      new URL('/api/email/send', request.nextUrl.origin),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email,
          subject: '🔐 Password Reset Request - NCDF COOP',
          html,
          text,
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to send email');
    }

    return NextResponse.json(
      { message: 'Password reset email sent successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return NextResponse.json(
      { error: 'Failed to send password reset email' },
      { status: 500 }
    );
  }
}
